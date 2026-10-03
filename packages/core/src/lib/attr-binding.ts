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

// A value no projection can produce, so the first application always goes
// through.
const unapplied = Symbol('loom.unapplied');

/**
 * Applies a binding to an attr slot: the immediate `watch` fire applies the
 * current projected value, and every later activity update re-runs only this
 * attribute's application — skipped when the projection is the same value
 * as last applied, so an update that leaves this attribute alone touches no
 * DOM. The unsubscriber registers on the host component context's teardowns
 * (released on unmount) and is returned so the updater can dispose it when a
 * re-render replaces the slot's value (design D2–D4 of
 * `add-reactive-attr-bindings`).
 */
export const bindAttr = (
    applyValue: (attrValue: TemplateTagValue) => void,
    binding: AttrBinding,
    hostCtx?: ComponentContextPartial
): Unsubscriber => {
    let applied: TemplateTagValue | typeof unapplied = unapplied;
    const unsubscribe = binding.watch(({ value: bindValue }) => {
        const attrValue = binding.select(bindValue);

        if (!Object.is(attrValue, applied)) {
            applied = attrValue;
            applyValue(attrValue);
        }
    });

    if (hostCtx) {
        hostCtx.teardowns = hostCtx.teardowns || new Set();
        hostCtx.teardowns.add(unsubscribe);
    }

    return unsubscribe;
};
