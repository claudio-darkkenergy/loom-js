import { config } from '../../config';
import type { ConfigEvent } from '../../types';
import { getDocument, getWindow } from '../dom';
import { toCamelCase } from '../helpers';
import type { PlanEntry, SlotKind, TemplatePlan } from './types';

// Named special attributes map straight to their kind; any other `$name` is
// an event when `config.events` lists it (dynamic, so not a map key), else a
// custom-element prop / plain attribute. A new special attribute is one entry.
const namedSpecialKinds: { [name: string]: SlotKind } = {
    attrs: 'attrs',
    on: 'on',
    props: 'props'
};

// Attribute names always read from `Attr.name`, never `Attr.nodeName` —
// `name` is the spec's canonical accessor for an attribute's qualified name.
const classifyAttr = (attrName: string): Omit<PlanEntry, 'node'> => {
    if (attrName[0] !== '$') {
        return { kind: 'attr', name: attrName };
    }

    const name = attrName.slice(1);
    const kind =
        namedSpecialKinds[name] ??
        (config.events.includes(name as ConfigEvent) ? 'event' : 'custom');

    return kind === 'custom'
        ? { kind, name, prop: toCamelCase(name) }
        : { kind, name };
};

// Splits a token-bearing text node (or table-content comment marker) in
// place into static text nodes and one text node per slot token, in order.
const splitTokens = (node: Comment | Text) => {
    const currentDocument = getDocument();
    const parts = (node.textContent ?? '').split(config.TOKEN);
    const tokens: Text[] = [];
    const nodes: Text[] = [];

    parts.forEach((part, index) => {
        part && nodes.push(currentDocument.createTextNode(part));

        if (index < parts.length - 1) {
            const token = currentDocument.createTextNode(config.TOKEN);

            tokens.push(token);
            nodes.push(token);
        }
    });
    node.replaceWith(...nodes);

    return tokens;
};

// The child-index path from `root` down to `node`.
const pathOf = (node: Node, root: Node) => {
    const path: number[] = [];

    while (node !== root) {
        let index = 0;
        let sibling = node.previousSibling;

        while (sibling) {
            index += 1;
            sibling = sibling.previousSibling;
        }

        path.unshift(index);
        node = node.parentNode as Node;
    }

    return path;
};

// Re-expresses a node's path relative to the previous dynamic node, which
// precedes it in document order: parent hops up to their fork, sibling hops
// across, then child indexes down.
const relativeSteps = (previous: number[], current: number[]) => {
    let fork = 0;

    while (fork < previous.length && previous[fork] === current[fork]) {
        fork += 1;
    }

    return fork === previous.length
        ? [0, 0, ...current.slice(fork)]
        : [
              previous.length - fork - 1,
              (current[fork] as number) - (previous[fork] as number),
              ...current.slice(fork + 1)
          ];
};

/**
 * Normalizes a parsed template fragment and compiles its plan. Every slot
 * token inside text becomes its own text node and every special attribute
 * is removed from its element, so a clone needs no per-instance splitting
 * or stripping; the plan then records how to reach each dynamic node and
 * how each dynamic path applies its value, in interpolation order.
 */
export const compilePlan = (fragment: DocumentFragment): TemplatePlan => {
    const { Comment, HTMLElement, NodeFilter, SVGElement, Text } = getWindow();
    const treeWalker = getDocument().createTreeWalker(
        fragment,
        NodeFilter.SHOW_ALL
    );
    // Collected before any split — splitting while walking would derail
    // the walker.
    const dynamicNodes: [Node, Attr[]][] = [];

    while (treeWalker.nextNode()) {
        const node = treeWalker.currentNode;

        if (node instanceof HTMLElement || node instanceof SVGElement) {
            const dynamicAttrs = Array.from(node.attributes).filter((attr) =>
                config.tokenRe.test(attr.value)
            );

            dynamicAttrs.length && dynamicNodes.push([node, dynamicAttrs]);
        } else if (
            (node instanceof Text || node instanceof Comment) &&
            config.tokenRe.test(node.textContent || '')
        ) {
            dynamicNodes.push([node, []]);
        }
    }

    const entries: PlanEntry[] = [];
    const targets: Node[] = [];

    dynamicNodes.forEach(([node, dynamicAttrs]) => {
        if (dynamicAttrs.length) {
            const target = targets.push(node) - 1;

            dynamicAttrs.forEach((attr) => {
                const entry = classifyAttr(attr.name);

                entry.kind !== 'attr' &&
                    (node as Element).removeAttribute(attr.name);
                entries.push({ ...entry, node: target });
            });
        } else {
            splitTokens(node as Comment | Text).forEach((token) => {
                entries.push({
                    kind: 'text',
                    name: '',
                    node: targets.push(token) - 1
                });
            });
        }
    });

    const paths = targets.map((target) => pathOf(target, fragment));

    return {
        entries,
        steps: paths.map((path, index) =>
            relativeSteps(index ? (paths[index - 1] as number[]) : [], path)
        )
    };
};
