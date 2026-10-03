import type {
    ComponentContextPartial,
    TemplateRoot,
    TemplateRootArray,
    TemplateTagValue
} from '../../types';
import {
    appendChildContext,
    isContextFunction,
    releaseChildContext
} from '../context';
import { getDocument, getWindow } from '../dom';
import { resolveValue } from './resolve-value';
import type { SlotApplier } from './types';
import { updateLiveNode } from './update-live-node';

// Places a resolved value as the live node(s): an element one for one, an
// array through the list reconciler, anything else as a text node.
const placeValue = (
    currentLiveNode: TemplateRoot | TemplateRootArray,
    value: unknown,
    valueCtx?: ComponentContextPartial
) => {
    if (value instanceof getWindow().Element) {
        return updateLiveNode([currentLiveNode, value]);
    }

    if (Array.isArray(value)) {
        return handleArrayValue([currentLiveNode, value], valueCtx);
    }

    return updateLiveNode([currentLiveNode, getNewTextValue(value)]);
};

/**
 * Reconciles a live node (or node list) with a new template value, resolved
 * against `valueCtx`, and returns what is live afterwards.
 */
export const textUpdater = (
    currentLiveNode: TemplateRoot | TemplateRootArray,
    newValue: TemplateTagValue,
    valueCtx?: ComponentContextPartial
) => placeValue(currentLiveNode, resolveValue(newValue, valueCtx), valueCtx);

/**
 * Applies a text slot: the value resolves against the slot's child context,
 * a primitive is written into the text node the slot owns, and anything
 * else replaces the live node(s) — a text node loom creates becomes the
 * owned one, a node the caller supplied is never written to.
 */
export const applyText: SlotApplier = (slot, _entry, newValue, ctx, index) => {
    const childCtx = appendChildContext(ctx, newValue, index);
    const value = resolveValue(newValue, childCtx);
    const { Element, Text } = getWindow();

    if (
        value instanceof Element ||
        value instanceof Text ||
        Array.isArray(value)
    ) {
        slot.node = placeValue(slot.node, value, childCtx);
        slot.state = undefined;
        return;
    }

    const ownedText = slot.state as Text | undefined;

    if (ownedText && slot.node === ownedText) {
        ownedText.data = String(value);
        return;
    }

    const text = getDocument().createTextNode(String(value));

    slot.node = updateLiveNode([slot.node, text]);
    slot.state = text;
};

const getNewTextValue = (value: Text | unknown) =>
    value instanceof getWindow().Text
        ? (value as Text)
        : getDocument().createTextNode(String(value));

// One children-array item's rendering: a single node, or the node group of a
// fragment-rooted item (a region or fragment-template component's root).
type LiveEntry = TemplateRoot | TemplateRootArray;

// One reconciled item: its rendering, the key it reconciles under and
// whether that key owns a child context in the parent (component and array
// items do; primitives and already-resolved nodes do not).
interface LiveItem {
    entry: LiveEntry;
    key: number | string;
    ownsContext: boolean;
}

// Items per reconciled array, keyed by the flat node array callers receive.
// A flat array with no stored items reconciles per node, by index.
const liveItemsStore = new WeakMap<TemplateRootArray, LiveItem[]>();

const firstNodeOf = (entry: LiveEntry) =>
    Array.isArray(entry) ? (entry[0] as TemplateRoot) : entry;

const nodesOf = (entry: LiveEntry) => (Array.isArray(entry) ? entry : [entry]);

// A component context function carries its `key`; everything else (activity
// context functions included) reconciles by index.
const keyOf = (value: TemplateTagValue, index: number) =>
    (isContextFunction(value) ? value.key : undefined) ?? index;

const ownsChildContext = (value: TemplateTagValue) =>
    isContextFunction(value) || Array.isArray(value);

// Coerces a resolved item value into its live entry.
const toLiveEntry = (resolvedValue: unknown): LiveEntry => {
    const { Comment, Element, HTMLElement, SVGElement } = getWindow();

    if (Array.isArray(resolvedValue)) {
        return resolvedValue.length
            ? (resolvedValue as TemplateTagValue[]).map((groupValue) =>
                  groupValue instanceof Element || groupValue instanceof Comment
                      ? (groupValue as TemplateRoot)
                      : getNewTextValue(groupValue)
              )
            : // An empty group keeps an empty text anchor, so the item holds
              // its position for a later non-empty update.
              [getDocument().createTextNode('')];
    }

    return resolvedValue instanceof HTMLElement ||
        resolvedValue instanceof SVGElement ||
        resolvedValue instanceof Comment
        ? (resolvedValue as TemplateRoot)
        : getNewTextValue(resolvedValue);
};

// The positions whose previous index forms a longest increasing subsequence
// — the items that keep their relative order and so never move. Positions
// with a negative previous index (new items) are skipped.
const stablePositions = (previousIndices: number[]) => {
    // `tails[length - 1]` is the position ending the shortest-tailed
    // increasing run of that length seen so far.
    const tails: number[] = [];
    const predecessors: number[] = [];
    const stable = new Set<number>();

    previousIndices.forEach((previousIndex, position) => {
        if (previousIndex < 0) {
            return;
        }

        let low = 0;
        let high = tails.length;

        while (low < high) {
            const mid = (low + high) >> 1;

            if ((previousIndices[tails[mid] ?? 0] ?? 0) < previousIndex) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        predecessors[position] = low > 0 ? (tails[low - 1] ?? -1) : -1;
        tails[low] = position;
    });

    let cursor = tails[tails.length - 1] ?? -1;

    while (cursor >= 0) {
        stable.add(cursor);
        cursor = predecessors[cursor] ?? -1;
    }

    return stable;
};

// Whether an entry's nodes already sit, in order, right before `anchor`.
const isPlacedBefore = (
    nodes: TemplateRootArray,
    anchor: Node | null,
    parent: Node
) =>
    nodes.every(
        (node, index) =>
            node.parentNode === parent &&
            node.nextSibling === (nodes[index + 1] ?? anchor)
    );

const handleArrayValue = (
    [liveNode, valueArray]: [
        TemplateRoot | TemplateRootArray | undefined,
        TemplateTagValue[]
    ],
    parentCtx?: ComponentContextPartial
) => {
    const liveNodeIsArray = Array.isArray(liveNode);
    // The previous pass's items — reconciliation is per item, not per node,
    // so groups move and leave as a unit.
    const previousItems: LiveItem[] = liveNodeIsArray
        ? (liveItemsStore.get(liveNode) ??
          liveNode.map((node, index) => ({
              entry: node,
              key: index,
              ownsContext: false
          })))
        : [];
    // `parentNode`, not `parentElement` — a top-level slot of a fragment
    // template has a `DocumentFragment` parent, which can host insertions
    // but is not an `Element`.
    const liveNodeParent = liveNodeIsArray
        ? liveNode[0]?.parentNode
        : liveNode?.parentNode;
    const lastPreviousNode = previousItems.length
        ? nodesOf(previousItems[previousItems.length - 1]!.entry).at(-1)
        : undefined;
    // Where the list ends: new and moved items are placed back to front,
    // each before the item that follows it, the last one before this.
    const tailAnchor: Node | null = liveNodeIsArray
        ? (lastPreviousNode?.nextSibling ?? null)
        : (liveNode ?? null);

    if (!valueArray.length) {
        // Ensure a value array has at least one defined value.
        valueArray.push(getDocument().createTextNode(''));
    }

    // Index the previous pass once: by key, and by first node for values
    // that arrive already resolved (an effect root re-visited by its slot
    // carries nodes, not keys).
    const previousIndexByKey = new Map<number | string, number>();
    const previousIndexByNode = new Map<Node, number>();

    previousItems.forEach(({ entry, key }, index) => {
        previousIndexByKey.set(key, index);
        previousIndexByNode.set(firstNodeOf(entry), index);
    });

    // Render every item against its persistent child context, and find the
    // previous item it continues: same key and same first node, or the same
    // first node under another key. Anything else is a new rendering.
    const previousIndices: number[] = [];
    const reused = new Set<number>();
    const nextItems = valueArray.map((newVal, index): LiveItem => {
        const key = keyOf(newVal, index);
        const childCtx = appendChildContext(parentCtx, newVal, key);
        const entry = toLiveEntry(resolveValue(newVal, childCtx));
        const firstNode = firstNodeOf(entry);
        const byKey = previousIndexByKey.get(key);
        const previousIndex =
            byKey !== undefined &&
            firstNodeOf(previousItems[byKey]!.entry) === firstNode
                ? byKey
                : (previousIndexByNode.get(firstNode) ?? -1);

        if (previousIndex > -1 && !reused.has(previousIndex)) {
            reused.add(previousIndex);
            previousIndices.push(previousIndex);
        } else {
            previousIndices.push(-1);
        }

        return { entry, key, ownsContext: ownsChildContext(newVal) };
    });

    // Items that left: remove their nodes, and release the child context of
    // a key that is gone altogether (a key re-rendered to new nodes keeps
    // its context — the pass above already renewed it).
    const nextKeys = new Set(nextItems.map(({ key }) => key));
    // Callers receive the flat node list; item boundaries live in the store.
    const nextLiveNode = nextItems.flatMap(({ entry }) => nodesOf(entry));
    const leavingNodes: Node[] = liveNodeIsArray
        ? liveNode
        : liveNode
          ? [liveNode]
          : [];

    previousItems.forEach(({ key, ownsContext }, index) => {
        !reused.has(index) &&
            ownsContext &&
            !nextKeys.has(key) &&
            parentCtx &&
            releaseChildContext(parentCtx, key);
    });

    if (
        liveNodeParent &&
        isWholeListReplacement(
            liveNodeParent,
            leavingNodes,
            nextLiveNode,
            reused
        )
    ) {
        // Nothing stays: one replacement of the parent's children instead of
        // a removal and an insertion per node.
        liveNodeParent.replaceChildren(toFragment(nextLiveNode));
        liveItemsStore.set(nextLiveNode, nextItems);
        return nextLiveNode;
    }

    previousItems.forEach(({ entry }, index) => {
        !reused.has(index) && nodesOf(entry).forEach((node) => node.remove());
    });

    // Place the rest, walking from the end: items in the longest run of
    // preserved relative order stay; every other item goes before the item
    // that follows it in the new order, consecutive ones as one insertion.
    const stable = stablePositions(previousIndices);
    let anchor = tailAnchor;
    // The entries awaiting insertion before `anchor`, last first.
    let pending: LiveEntry[] = [];
    const placePending = () => {
        if (pending.length && liveNodeParent) {
            liveNodeParent.insertBefore(
                toFragment(pending.reverse().flatMap(nodesOf)),
                anchor
            );
            pending = [];
        }
    };

    for (let index = nextItems.length - 1; index >= 0; index--) {
        const { entry } = nextItems[index]!;
        const nodes = nodesOf(entry);

        if (
            stable.has(index) ||
            !liveNodeParent ||
            isPlacedBefore(nodes, anchor, liveNodeParent)
        ) {
            placePending();
            anchor = nodes[0] ?? anchor;
        } else {
            pending.push(entry);
        }
    }

    placePending();

    if (!liveNodeIsArray && liveNode && anchor !== liveNode) {
        // The single live node was the placeholder the list replaced — unless
        // it is itself the first item now.
        !nextItems.some(({ entry }) => nodesOf(entry).includes(liveNode)) &&
            liveNode.remove();
    }

    liveItemsStore.set(nextLiveNode, nextItems);
    return nextLiveNode;
};

// Gathers nodes into a fragment, so they insert in one operation; bounded
// slices keep each `append` call within the engine's argument limit.
const toFragment = (nodes: Node[]) => {
    const fragment = getDocument().createDocumentFragment();

    for (let start = 0; start < nodes.length; start += 1024) {
        fragment.append(...nodes.slice(start, start + 1024));
    }

    return fragment;
};

// Whether a pass replaces the parent's children wholesale: no previous item
// continues, the leaving nodes are exactly the parent's children, and no
// next node is among them.
const isWholeListReplacement = (
    parent: ParentNode,
    leavingNodes: Node[],
    nextNodes: Node[],
    reused: Set<number>
) =>
    reused.size === 0 &&
    leavingNodes.length > 0 &&
    leavingNodes.length === parent.childNodes.length &&
    leavingNodes.every((node) => node.parentNode === parent) &&
    nextNodes.every((node) => node.parentNode !== parent);
