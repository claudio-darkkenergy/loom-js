import type { TemplateRoot } from '../../types';
import {
    applyAttr,
    applyAttrs,
    applyCustom,
    applyEvent,
    applyOn,
    applyProps
} from './attr-updaters';
import { applyText } from './text-updater';
import type { Slot, SlotApplier, SlotKind, TemplatePlan } from './types';

// Follows a node's steps from the previous dynamic node: parent hops,
// sibling hops, then child indexes as `firstChild` plus sibling hops —
// `childNodes` would allocate a list on every element visited.
const reach = (from: Node, steps: number[]) => {
    let node = from;

    for (let hop = 0; hop < (steps[0] as number); hop++) {
        node = node.parentNode as Node;
    }

    for (let hop = 0; hop < (steps[1] as number); hop++) {
        node = node.nextSibling as Node;
    }

    for (let depth = 2; depth < steps.length; depth++) {
        node = node.firstChild as Node;

        for (let hop = 0; hop < (steps[depth] as number); hop++) {
            node = node.nextSibling as Node;
        }
    }

    return node as TemplateRoot;
};

/**
 * Builds a fresh clone's slots over the template plan, one per dynamic
 * path: each holds its live node, no value yet, and — for a text path —
 * the token text node it owns.
 */
export const createSlots = (
    plan: TemplatePlan,
    liveFragment: DocumentFragment
): Slot[] => {
    const nodes: TemplateRoot[] = [];

    plan.steps.forEach((steps, index) => {
        nodes.push(
            reach(index ? (nodes[index - 1] as Node) : liveFragment, steps)
        );
    });

    return plan.entries.map(({ kind, node }) => {
        const liveNode = nodes[node] as TemplateRoot;

        return {
            node: liveNode,
            state: kind === 'text' ? (liveNode as Text) : undefined,
            value: undefined
        };
    });
};

const appliers: { [kind in SlotKind]: SlotApplier } = {
    attr: applyAttr,
    attrs: applyAttrs,
    custom: applyCustom,
    event: applyEvent,
    on: applyOn,
    props: applyProps,
    text: applyText
};

/**
 * Applies a value to a slot through the shared update function for its
 * plan entry's kind.
 */
export const applySlot: SlotApplier = (slot, entry, value, ctx, index) =>
    appliers[entry.kind](slot, entry, value, ctx, index);
