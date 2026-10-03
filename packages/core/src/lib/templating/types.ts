import type {
    ComponentContextPartial,
    TemplateRoot,
    TemplateRootArray,
    TemplateTagValue,
    Unsubscriber
} from '../../types';

// How a dynamic path applies its value: a text node, a standard attribute,
// a dom-event listener, the `$attrs`/`$on`/`$props` specials, or any other
// `$name` (a custom-element prop, else a plain attribute).
export type SlotKind =
    'attr' | 'attrs' | 'custom' | 'event' | 'on' | 'props' | 'text';

// One dynamic path of a template, classified once per template and document.
export interface PlanEntry {
    kind: SlotKind;
    // The attribute or event name, `$` stripped; empty for a text path.
    name: string;
    // Index into `TemplatePlan.steps` of the node this path updates.
    node: number;
    // The custom-element prop name a `custom` path sets.
    prop?: string;
}

// A template's dynamic wiring, shared by every instance: one entry per dynamic
// path, and the steps to each dynamic node from the one before it in document
// order (the clone for the first): parent hops, sibling hops, child indexes.
export interface TemplatePlan {
    entries: PlanEntry[];
    steps: number[][];
}

// What a kind keeps per instance: the owned text node of a text slot, the
// binding unsubscriber of a bound attribute, the listener of an event slot,
// or the per-key registry of `$attrs` bindings / `$on` listeners.
export type SlotState =
    | EventListenerOrEventListenerObject
    | Map<string, EventListenerOrEventListenerObject | Unsubscriber>
    | Text
    | Unsubscriber;

// The per-instance state of one dynamic path: its live node (or node list
// after a list render), the value last applied, and the kind's state.
export interface Slot {
    node: TemplateRoot | TemplateRootArray;
    state: SlotState | undefined;
    value: TemplateTagValue;
}

// Applies a value to a slot; one per kind, shared by every instance.
export type SlotApplier = (
    slot: Slot,
    entry: PlanEntry,
    value: TemplateTagValue,
    ctx: ComponentContextPartial,
    index: number
) => void;
