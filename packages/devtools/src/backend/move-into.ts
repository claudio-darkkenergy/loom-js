// Re-parents the backend's own page nodes without losing their state.
type MovableParent = Element & {
    moveBefore?(node: Node, child: Node | null): void;
};

/**
 * Appends `node` to `target`; `moveBefore` keeps an iframe's document
 * alive, where plain insertion reloads it.
 * @param target The new parent.
 * @param node The node to move.
 */
export const moveInto = (target: Element, node: Node) => {
    if (node.parentNode === target) {
        return;
    }

    try {
        (target as MovableParent).moveBefore
            ? (target as MovableParent).moveBefore!(node, null)
            : target.append(node);
    } catch {
        target.append(node);
    }
};
