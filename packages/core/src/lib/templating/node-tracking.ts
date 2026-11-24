import type {
    ComponentContextPartial,
    TemplateRoot,
    TemplateRootArray
} from '../../types';
import { substituteNodes } from './reconcile-list';
import type { PlanEntry, Slot } from './types';

type Nodes = TemplateRoot | TemplateRootArray;

const toNodeArray = (nodes: Nodes) => (Array.isArray(nodes) ? nodes : [nodes]);

const isSameNodes = (previous: Nodes, next: Nodes) =>
    previous === next ||
    (Array.isArray(previous) &&
        Array.isArray(next) &&
        previous.length === next.length &&
        previous.every((node, index) => node === next[index]));

const keyOfChild = (
    children: Map<number | string, ComponentContextPartial> | undefined,
    child: ComponentContextPartial
) => {
    for (const [key, value] of children ?? []) {
        if (value === child) {
            return key as number;
        }
    }
};

/**
 * Records a fragment instance's top level, in order: each static node, or
 * the index of the text slot that fills that position.
 */
export const recordLayout = (
    liveFragment: DocumentFragment,
    slots: Slot[],
    entries: PlanEntry[]
) =>
    Array.from(liveFragment.childNodes, (node) => {
        const index = slots.findIndex(
            (slot, slotIndex) =>
                slot.node === node && entries[slotIndex]!.kind === 'text'
        );

        return index < 0 ? (node as TemplateRoot) : index;
    });

/**
 * Builds a fragment instance's root from its recorded layout and the
 * current nodes of its top-level slots.
 */
export const layoutNodes = ({ layout, slots }: ComponentContextPartial) => {
    const nodes: TemplateRootArray = [];

    layout!.forEach((entry) => {
        if (typeof entry !== 'number') {
            nodes.push(entry);
            return;
        }

        const slotNode = slots![entry]!.node;

        Array.isArray(slotNode)
            ? slotNode.forEach((node) => nodes.push(node))
            : nodes.push(slotNode);
    });

    return nodes;
};

/**
 * Carries an effect's change from `previous` to `next` nodes up to the
 * contexts that hold them: each effect root, the slot placing the change and,
 * where that slot is top-level, the fragment root, until an element root.
 */
export const carryNodeChange = (
    origin: ComponentContextPartial,
    previous: Nodes,
    next: Nodes
) => {
    if (isSameNodes(previous, next)) {
        return;
    }

    const previousNodes = toNodeArray(previous);
    const nextNodes = toNodeArray(next);
    let child = origin;
    let parent = origin.parent;

    while (parent) {
        if (parent.activity) {
            const root = substituteNodes(
                parent.root!,
                previousNodes,
                nextNodes
            );

            if (!root) {
                return;
            }

            parent.root = root;
        } else {
            // A list item reaches its component's slot through the slot's
            // array context; anything else sits in the slot itself.
            const listOwner = parent.slots ? undefined : parent.parent;
            const owner = listOwner ?? parent;
            const key = listOwner
                ? keyOfChild(listOwner.arrayChildren, parent)
                : keyOfChild(parent.children, child);
            const slot = key === undefined ? undefined : owner.slots?.[key];
            const slotNode =
                slot && substituteNodes(slot.node, previousNodes, nextNodes);

            if (!slotNode) {
                return;
            }

            slot!.node = slotNode;

            if (!owner.layout?.includes(key!)) {
                return;
            }

            owner.root = layoutNodes(owner);
            parent = owner;
        }

        child = parent;
        parent = parent.parent;
    }
};
