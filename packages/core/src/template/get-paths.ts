import { config } from '../config';

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
                paths.set(getNewPath(currentNode), attrs);
            }
        } else if (
            // @TODO Handle Comment w/ dynamic nodes.
            (currentNode instanceof Text || currentNode instanceof Comment) &&
            config.tokenRe.test(currentNode.textContent || '')
        ) {
            // Parse text nodes.
            paths.set(getNewPath(currentNode), undefined);
        }
    };
    const paths = new Map<number[], Attr[] | undefined>();

    // Walk the node tree to get all dynamic node paths.
    // The paths will be used to set the updaters.
    while (treeWalker.nextNode()) {
        handleTreeNode(treeWalker.currentNode);
    }

    console.log({ paths: Array.from(paths.keys()) });
    return paths;
};
