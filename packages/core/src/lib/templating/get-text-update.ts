import type {
    ComponentContextPartial,
    TemplateRoot,
    TemplateRootArray,
    TemplateTagValue
} from '../../types';
import { appendChildContext, getContextForValue } from '../context';
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

// Group boundaries per reconciled array, keyed by the flat node array handed
// back to callers. `ctx.root` and its consumers only ever see flat arrays;
// the nested entry shape stays private to this module. A flat array with no
// stored entries (e.g. an effect root resolved elsewhere) reconciles per node.
const liveEntriesStore = new WeakMap<TemplateRootArray, LiveEntry[]>();

const firstNodeOf = (entry?: LiveEntry) =>
    Array.isArray(entry) ? entry[0] : entry;

const nodesOf = (entry: LiveEntry) => (Array.isArray(entry) ? entry : [entry]);

const handleArrayValue = (
    [liveNode, valueArray]: [
        TemplateRoot | TemplateRootArray,
        TemplateTagValue[]
    ],
    parentCtx?: ComponentContextPartial
) => {
    const liveNodeIsArray = Array.isArray(liveNode);
    // The previous pass's per-item entries — the cursor & move bookkeeping
    // below is per item, not per node, so groups reconcile as a unit.
    const entries: LiveEntry[] = liveNodeIsArray
        ? (liveEntriesStore.get(liveNode) ?? [...liveNode])
        : [];
    // `parentNode`, not `parentElement` — a top-level slot of a fragment
    // template has a `DocumentFragment` parent, which can host insertions
    // but is not an `Element`.
    const liveNodeParent = liveNodeIsArray
        ? liveNode[0]?.parentNode
        : liveNode?.parentNode;
    const { Comment, Element, HTMLElement, SVGElement } = getWindow();

    if (!valueArray.length) {
        // Ensure a value array has at least one defined value.
        valueArray.push(getDocument().createTextNode(''));
    }

    // Update the DOM  w/ the pending (new) nodes.
    const nextEntries = valueArray.map((newVal, i): LiveEntry => {
        const ctxSnapshot = getContextForValue(newVal);
        const childCtx = appendChildContext(
            parentCtx,
            newVal,
            ctxSnapshot.key ?? i
        );
        // The resolved `TemplateTagValue`
        const resolvedValue = resolveValue(newVal, childCtx);
        const resolvedIsGroup = Array.isArray(resolvedValue);
        const isHtmlOrSvgElement =
            resolvedValue instanceof HTMLElement ||
            resolvedValue instanceof SVGElement;
        const currentEntry: LiveEntry = resolvedIsGroup
            ? resolvedValue.length
                ? (resolvedValue as TemplateTagValue[]).map((groupValue) =>
                      groupValue instanceof Element ||
                      groupValue instanceof Comment
                          ? (groupValue as TemplateRoot)
                          : // Coerce to a valid `LiveNode` as if not already.
                            getNewTextValue(groupValue)
                  )
                : // An empty group keeps an empty text anchor, so the item
                  // holds its position for a later non-empty update.
                  [getDocument().createTextNode('')]
            : isHtmlOrSvgElement || resolvedValue instanceof Comment
              ? resolvedValue
              : // Coerce to a valid `LiveNode` as if not already.
                getNewTextValue(resolvedValue);
        // A group's identity is its first node: a fragment-rooted item with a
        // persistent child context resolves to the same node instances every
        // pass, so a changed first node means a genuinely different item.
        const currentFirstNode = firstNodeOf(currentEntry) as TemplateRoot;
        const currentNodes = nodesOf(currentEntry);
        // Groups reuse in place like elements do; text always re-inserts.
        const reusableInPlace = resolvedIsGroup || isHtmlOrSvgElement;

        if (!liveNodeIsArray) {
            // Handle single `LiveNode` updates.
            if (!liveNode?.isSameNode(currentFirstNode)) {
                // Insert before the live node.
                // The live node will be removed from the DOM after all insertions.
                currentNodes.forEach((node) =>
                    liveNodeParent?.insertBefore(node, liveNode)
                );
            }
        } else if (
            (reusableInPlace &&
                !firstNodeOf(entries[i])?.isSameNode(currentFirstNode)) ||
            !reusableInPlace
        ) {
            // Handle array `LiveNode` updates.
            const cursorNode = firstNodeOf(entries[i]);
            const existingIndex = entries.findIndex(
                (entry) => firstNodeOf(entry) === currentFirstNode
            );

            // `entries` must reflect the new order to keep the next cursor position in sync w/
            // the right cursor target on the next update.
            existingIndex > -1 && entries.splice(existingIndex, 1);
            entries.splice(i, 0, currentEntry);

            currentNodes.forEach((node) =>
                cursorNode && !node.contains(cursorNode)
                    ? liveNodeParent?.insertBefore(node, cursorNode)
                    : liveNodeParent?.appendChild(node)
            );
        }

        return currentEntry;
    });

    // Do cleanup.
    if (liveNodeIsArray) {
        // Cleanup the excess old live entries — every node of each group.
        entries
            .slice(valueArray.length)
            .forEach((entry) =>
                nodesOf(entry).forEach((node) => node.remove())
            );
    } else {
        // Cleanup the old live node anchor.
        liveNode?.remove();
    }

    // Callers receive the flat node list; group boundaries live in the store.
    const nextLiveNode = nextEntries.flat();

    liveEntriesStore.set(nextLiveNode, nextEntries);
    return nextLiveNode;
};
