import { getTemplateRoot } from './helpers';
import { ComponentContextPartial, TemplateRoot } from './types';

/**
 * The `MutationCallback` to get call by the `MutationObserver` on DOM mutations.
 * @param diffNodes The nodes which have been added or removed from the DOM.
 */
const domChanged: MutationCallback = (diffNodes) =>
    diffNodes.forEach(({ addedNodes, removedNodes, type }) => {
        switch (type) {
            case 'childList':
                // Handle removed nodes.
                if (removedNodes.length) {
                    const cleanUp = (node: Node) => {
                        const ctx = lifeCycleNodes.get(node);

                        if (ctx) {
                            ctx.unmounted && ctx.unmounted(node);
                            lifeCycleNodes.delete(node);
                        }
                    };

                    // Calls the `onUnmounted` life-cycle handler for each removed node if defined.
                    removedNodes.forEach((node) => {
                        const treeWalker = document.createTreeWalker(
                            node,
                            window.NodeFilter.SHOW_ELEMENT
                        );

                        // Cleanup & handle the unmount of this node...
                        cleanUp(treeWalker.currentNode);

                        // ...and all of its children.
                        while (treeWalker.nextNode()) {
                            const currentNode = treeWalker.currentNode;
                            cleanUp(currentNode);
                        }
                    });
                }

                // Handle added nodes.
                if (addedNodes.length) {
                    const handleMount = (node: Node) => {
                        const ctx = lifeCycleNodes.get(node);
                        ctx?.mounted && ctx.mounted(node);
                    };

                    // Calls the `onMounted` life-cycle handler for each added node if defined.
                    addedNodes.forEach((node) => {
                        const treeWalker = document.createTreeWalker(
                            node,
                            window.NodeFilter.SHOW_ELEMENT
                        );

                        // Handle the mount of this node...
                        handleMount(treeWalker.currentNode);

                        // ...and all of its children.
                        while (treeWalker.nextNode()) {
                            const currentNode = treeWalker.currentNode;
                            handleMount(currentNode);
                        }
                    });
                }
        }
    });

/*
 * Life-cycle hooks occur in the following order:
 *      1. Created - Once per component creation.
 *      2. Rendered - 1st time a component is rendered,
 *                  - again for every `effect` update after the 1st one.
 *      -- Note: `onAppMounted` is called here before the next life-cycle hooks are called.
 *      3. Mounted - nodes are connected to the DOM,
 *                 - processed for each component from the queue, 1st-in/out, during the 1st mounted cycle,
 *                 - & again when new nodes are mounted, observed by the `MutationObserver`.
 *      4. Unmounted - nodes are disconnected from the DOM,
 *                   - processed for each component, observed by the `MutationObserver`.
 */
export const lifeCycles = {
    /**
     * Initializes the life-cycle hooks for a given node.
     * The component has been created, but not mounted.
     * @param ctx `ComponentContextPartial` which holds life-cycle handlers for the node.
     */
    creation(ctx: ComponentContextPartial) {
        // Creation life-cycle handler - only once.
        created(ctx);
    },
    /**
     * Kicks off the observation via `MutationObserver` to listen for DOM tree adds/removals.
     * @param observableNode The App node to observe for changes in its DOM tree.
     */
    observe(observableNode: Node | NodeList) {
        const observer = new MutationObserver(domChanged);

        // Execute all the `onMounted` handlers since all the nodes are now in the DOM.
        lifeCycleNodes.forEach((ctx, node) => {
            const root = getTemplateRoot(ctx.root);

            if (root && document.contains(root)) {
                ctx.mounted && ctx.mounted(root);
            } else {
                lifeCycleNodes.delete(node);
            }
        });

        // Observe future DOM updates.
        observableNode instanceof NodeList
            ? Array.from(observableNode)
            : [observableNode].forEach((node) => {
                  observer.observe(node, { childList: true, subtree: true });
              });
    },
    preRender(ctx: ComponentContextPartial) {
        // Before-rendered life-cycle handler - called on every render.
        const root = getTemplateRoot(ctx.root);
        ctx.beforeRender && root && ctx.beforeRender(root);
    },
    postRender(ctx: ComponentContextPartial) {
        // Rendered life-cycle handler - called on every render.
        const root = getTemplateRoot(ctx.root);
        ctx.rendered && root && ctx.rendered(root);
    }
};

const created = (ctx: ComponentContextPartial) => {
    // Creation life-cycle handler - only once.
    if (ctx.root && !lifeCycleNodes.has(ctx.root)) {
        lifeCycleNodes.set(ctx.root, ctx);

        const root = getTemplateRoot(ctx.root);
        ctx.created && root && ctx.created(root);
    }
};

// Holds reference to the life-cycle handlers for each component node.
const lifeCycleNodes = new Map<TemplateRoot, ComponentContextPartial>();
