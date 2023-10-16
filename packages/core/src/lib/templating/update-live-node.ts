import { TemplateRoot, TemplateRootArray } from '../../types';

// Updates a single live node - 1 for 1.
export const updateLiveNode = ([liveNode, value]: [
    TemplateRoot | TemplateRootArray,
    TemplateRoot
]) => {
    let replaceableNode: TemplateRoot;

    if (Array.isArray(liveNode)) {
        replaceableNode = liveNode.splice(0, 1)[0];
        liveNode.forEach((node) => node.remove());
    } else {
        replaceableNode = liveNode;
    }

    // Only replace if the node is different than what's currently live to avoid unnecessary paints.
    if (replaceableNode && !replaceableNode.isEqualNode(value)) {
        replaceableNode.replaceWith(value);
    }
};
