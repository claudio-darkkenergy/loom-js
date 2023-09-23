import { config } from '../../config';

export const getPaths = (treeWalker: TreeWalker) => {
    const getNewPath = (node: Node) => {
        // Includes all path-points to the node except the document fragment.
        const path: number[] = [];

        do {
            if (node.parentNode) {
                path.unshift(
                    Array.from(node.parentNode.childNodes).indexOf(
                        node as ChildNode & Node
                    )
                );
                node = node.parentNode;
            }
        } while (
            // `treeWalker.root` is the document fragment.
            node !== treeWalker.root
        );

        return path;
    };
    const handleTreeNode = (currentNode: Node) => {
        if (
            currentNode instanceof HTMLElement ||
            currentNode instanceof SVGElement
        ) {
            // Parse attribute nodes.
            const attrs = Array.from(currentNode.attributes).filter((attr) =>
                config.tokenRe.test(attr.value)
            );

            if (attrs.length) {
                const nodePath = getNewPath(currentNode);
                // Set paths for each dynamic attribute.
                attrs.forEach((attr) => {
                    return paths.add([nodePath, attr]);
                });
            }
        } else if (
            (currentNode instanceof Text || currentNode instanceof Comment) &&
            config.tokenRe.test(currentNode.textContent || '')
        ) {
            // Parse text nodes.
            const nodePath = getNewPath(currentNode);
            const dynamicSlotsIterator = currentNode.textContent?.matchAll(
                config.tokenReGlobal
            );

            // Set paths for each dynamic slot.
            while (dynamicSlotsIterator?.next().value) {
                paths.add([nodePath, undefined]);
            }
        }
    };
    const paths = new Set<[number[], Attr | undefined]>();

    // Walk the node tree to get all dynamic node paths.
    // The paths will be used to set the updaters.
    while (treeWalker.nextNode()) {
        handleTreeNode(treeWalker.currentNode);
    }

    return paths;
};
