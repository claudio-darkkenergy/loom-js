import type {
    ComponentContextPartial,
    TemplateRoot,
    TemplateRootArray,
    TemplateTagValue
} from '../../types';
import { appendChildContext, getContextForValue } from '../context';
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

    if (value instanceof Element) {
        // Handle `Element` nodes.
        currentLiveNode = updateLiveNode([currentLiveNode, value]);
    } else if (Array.isArray(value)) {
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
    value instanceof Text ? value : document.createTextNode(String(value));

const handleArrayValue = (
    [liveNode, valueArray]: [
        TemplateRoot | TemplateRootArray,
        TemplateTagValue[]
    ],
    parentCtx?: ComponentContextPartial
) => {
    const liveNodeIsArray = Array.isArray(liveNode);
    const liveNodeParent = liveNodeIsArray
        ? liveNode[0]?.parentElement
        : liveNode?.parentElement;
    let nextLiveNode: TemplateRootArray;

    if (!valueArray.length) {
        // Ensure a value array has at least one defined value.
        valueArray.push(document.createTextNode(''));
    }

    // Update the DOM  w/ the pending (new) nodes.
    nextLiveNode = valueArray.map((newVal, i) => {
        const ctxSnapshot = getContextForValue(newVal);
        const childCtx = appendChildContext(
            parentCtx,
            newVal,
            ctxSnapshot.key || i
        );
        // The resolved `TemplateTagValue`
        const resolvedValue = resolveValue(newVal, childCtx);
        const isHtmlOrSvgElement =
            resolvedValue instanceof HTMLElement ||
            resolvedValue instanceof SVGElement;
        const currentLiveNode =
            isHtmlOrSvgElement || resolvedValue instanceof Comment
                ? resolvedValue
                : // Coerce to a valid `LiveNode` as if not already.
                  getNewTextValue(resolvedValue);

        if (!liveNodeIsArray) {
            // Handle single `LiveNode` updates.
            if (!liveNode?.isSameNode(currentLiveNode)) {
                // Insert before the live node.
                // The live node will be removed from the DOM after all insertions.
                liveNodeParent?.insertBefore(currentLiveNode, liveNode);
            }
        } else if (
            (isHtmlOrSvgElement && !liveNode[i]?.isSameNode(currentLiveNode)) ||
            !isHtmlOrSvgElement
        ) {
            // Handle array `LiveNode` updates.
            const cursorNode = liveNode[i];

            // `liveNode` must reflect the new order to keep the next cursor position in sync w/
            // the right cursor target on the next update.
            liveNode.includes(currentLiveNode) &&
                liveNode.splice(liveNode.indexOf(currentLiveNode), 1);
            liveNode.splice(i, 0, currentLiveNode);

            cursorNode && !currentLiveNode.contains(cursorNode)
                ? liveNodeParent?.insertBefore(currentLiveNode, cursorNode)
                : liveNodeParent?.appendChild(currentLiveNode);
        }

        return currentLiveNode;
    });

    // Do cleanup.
    if (liveNodeIsArray) {
        // Cleanup the excess old live nodes.
        liveNode.slice(valueArray.length).forEach((node) => node.remove());
    } else {
        // Cleanup the old live node anchor.
        liveNode?.remove();
    }

    return nextLiveNode;
};
