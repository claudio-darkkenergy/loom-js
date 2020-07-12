import { config } from '../config';
import { DynamicTemplateNodesMap } from '../index.d';

const { tokenRe } = config;

export const setDynamicNodes = <T extends DynamicTemplateNodesMap>(
    map: T,
    treeWalker: TreeWalker
) => {
    const updateMap = (node: Node) => {
        const dynamicNode = node;
        const path = [];

        if (node.parentNode) {
            // Get the full path to the root.
            do {
                path.unshift(
                    Array.from(node.parentNode.childNodes).indexOf(
                        node as ChildNode
                    )
                );
                node = node.parentNode;
            } while (node !== treeWalker.root && node.parentNode);
        }

        map.set(dynamicNode, path);
    };

    while (treeWalker.nextNode()) {
        const currentNode = treeWalker.currentNode as ChildNode;
        if (
            currentNode instanceof HTMLElement ||
            currentNode instanceof SVGElement
        ) {
            // Parse attribute nodes.
            const dynamicAttr = Array.from(currentNode.attributes).some(
                (attr) => tokenRe.test(attr.value) || tokenRe.test(attr.name)
            );

            if (dynamicAttr) {
                updateMap(currentNode);
            }
        } else if (
            currentNode instanceof Text &&
            tokenRe.test(currentNode.textContent || '')
        ) {
            // Parse text nodes.
            currentNode.textContent = (currentNode.textContent || '').trim();
            updateMap(currentNode);
        }
    }
};
