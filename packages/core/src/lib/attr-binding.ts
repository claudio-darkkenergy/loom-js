import type {
    ComponentContextPartial,
    TemplateTagValue,
    Unsubscriber,
    ValueProp
} from '../types';

// Marks an object as an attribute binding (`activity.bind`) — a `Symbol`
// property so no consumer value can collide with it.
export const ATTR_BINDING = Symbol('loom.attr-binding');

// A live attribute value produced by `activity.bind(select?)`: the templating
// layer applies `select` of the current value immediately and re-applies it
// on every activity update, without re-rendering the host component.
export interface AttrBinding<V = any> {
    [ATTR_BINDING]: true;
    select(bindValue: V): TemplateTagValue;
    watch(action: (valueProp: ValueProp<V>) => any): Unsubscriber;
}

export const isAttrBinding = (candidate: unknown): candidate is AttrBinding =>
    typeof candidate === 'object' &&
    candidate !== null &&
    (candidate as AttrBinding)[ATTR_BINDING] === true;

/**
 * Applies a binding to an attr slot: the immediate `watch` fire applies the
 * current projected value, and every later activity update re-runs only this
 * attribute's application. The unsubscriber registers on the host component
 * context's teardowns (released on unmount) and is returned so the updater
 * can dispose it when a re-render replaces the slot's value (design D2–D4 of
 * `add-reactive-attr-bindings`).
 */
export const bindAttr = (
    applyValue: (attrValue: TemplateTagValue) => void,
    binding: AttrBinding,
    hostCtx?: ComponentContextPartial
): Unsubscriber => {
    const unsubscribe = binding.watch(({ value: bindValue }) =>
        applyValue(binding.select(bindValue))
    );

    if (hostCtx) {
        hostCtx.teardowns = hostCtx.teardowns || new Set();
        hostCtx.teardowns.add(unsubscribe);
    }

    return unsubscribe;
};
