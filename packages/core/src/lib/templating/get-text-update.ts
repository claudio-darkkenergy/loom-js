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
import { updateLiveNode } from './update-live-node';

export function getTextUpdate(liveNode: Text) {
    let currentLiveNode: TemplateRoot | TemplateRootArray = liveNode;
    return (...args: [TemplateTagValue, ComponentContextPartial | undefined]) =>
        (currentLiveNode = textUpdater(currentLiveNode, ...args));
}

export const textUpdater = (
    currentLiveNode: TemplateRoot | TemplateRootArray,
    newValue: TemplateTagValue,
    valueCtx?: ComponentContextPartial
) => {
    // Update for each `LiveNode`.
    const value = resolveValue(newValue, valueCtx);

    if (value instanceof getWindow().Element) {
        // Handle `Element` nodes.
        currentLiveNode = updateLiveNode([currentLiveNode, value]);
    } else if (Array.isArray(value)) {
        // console.log('Array value', { value });
        currentLiveNode = handleArrayValue([currentLiveNode, value], valueCtx);
    } else {
        // Handle `Text` nodes.
        // Coerce to a valid `LiveNode` as if not already.
        const newTextValue = getNewTextValue(value);
        currentLiveNode = updateLiveNode([currentLiveNode, newTextValue]);
    }

    return currentLiveNode;
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

    previousItems.forEach(({ entry, key, ownsContext }, index) => {
        if (reused.has(index)) {
            return;
        }

        nodesOf(entry).forEach((node) => node.remove());
        ownsContext &&
            !nextKeys.has(key) &&
            parentCtx &&
            releaseChildContext(parentCtx, key);
    });

    // Place the rest. Items in the longest run of preserved relative order
    // stay where they are; every other item is inserted before the item
    // that follows it in the new order, walking from the end.
    const stable = stablePositions(previousIndices);
    let anchor = tailAnchor;

    for (let index = nextItems.length - 1; index >= 0; index--) {
        const nodes = nodesOf(nextItems[index]!.entry);

        if (
            !stable.has(index) &&
            liveNodeParent &&
            !isPlacedBefore(nodes, anchor, liveNodeParent)
        ) {
            nodes.forEach((node) => liveNodeParent.insertBefore(node, anchor));
        }

        anchor = nodes[0] ?? anchor;
    }

    if (!liveNodeIsArray && liveNode && anchor !== liveNode) {
        // The single live node was the placeholder the list replaced — unless
        // it is itself the first item now.
        !nextItems.some(({ entry }) => nodesOf(entry).includes(liveNode)) &&
            liveNode.remove();
    }

    // Callers receive the flat node list; item boundaries live in the store.
    const nextLiveNode = nextItems.flatMap(({ entry }) => nodesOf(entry));

    liveItemsStore.set(nextLiveNode, nextItems);
    return nextLiveNode;
};
