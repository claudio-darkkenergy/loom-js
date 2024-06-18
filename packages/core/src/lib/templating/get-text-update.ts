import type {
    ComponentContextPartial,
    TemplateRoot,
    TemplateRootArray,
    TemplateTagValue
} from '../../types';
import { appendChildContext } from '../context';
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
        let currentLiveNode: TemplateRoot;
        // The resolved `TemplateTagValue`
        const childCtx = appendChildContext(parentCtx, newVal, i);
        const resolvedValue = resolveValue(newVal, childCtx);

        if (
            resolvedValue instanceof HTMLElement ||
            resolvedValue instanceof SVGElement
        ) {
            // Handle `Element` nodes.
            // Handle single `LiveNode` updates.
            if (!liveNodeIsArray) {
                // Insert before the live node.
                // The live node will be removed from the DOM after all insertions.
                liveNodeParent?.insertBefore(resolvedValue, liveNode);
            }
            // Handle `LiveNode[]` updates when the resolved vs. live nodes are not the same.
            else if (!resolvedValue.isSameNode(liveNode[i] ?? null)) {
                if (liveNode[i] !== undefined) {
                    liveNode[i]?.replaceWith(resolvedValue);
                } else {
                    // Handle `undefined` live node.
                    liveNodeParent?.appendChild(resolvedValue);
                }
            }

            currentLiveNode = resolvedValue;
        } else {
            // Handle `Text` or `Comment` nodes.
            const textOrCommentValue =
                resolvedValue instanceof Comment
                    ? resolvedValue
                    : // Coerce to a valid `LiveNode` as if not already.
                      getNewTextValue(resolvedValue);

            // Handle single `LiveNode` updates.
            if (!liveNodeIsArray) {
                // Insert before the live node.
                // The live node will be removed from the DOM after all insertions.
                liveNodeParent?.insertBefore(textOrCommentValue, liveNode);
            } else {
                if (liveNode[i] !== undefined) {
                    // Always replace when the new value is `Text` or `Comment`.
                    liveNode[i]?.replaceWith(textOrCommentValue);
                } else if (liveNodeParent) {
                    // Handle `undefined` live node.
                    liveNodeParent.appendChild(textOrCommentValue);
                }
            }

            currentLiveNode = textOrCommentValue;
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
