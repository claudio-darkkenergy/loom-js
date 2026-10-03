import type {
    ComponentContextPartial,
    TemplateRoot,
    TemplateRootArray,
    TemplateTagValue
} from '../../types';
import { appendChildContext } from '../context';
import { getDocument, getWindow } from '../dom';
import { handleArrayValue } from './reconcile-list';
import { resolveValue } from './resolve-value';
import { getNewTextValue } from './text-node';
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
