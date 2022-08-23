import { TemplateContext } from './types';
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
    creation(ctx: TemplateContext) {
        // Creation life-cycle handler - only once.
        if (!lifeCycleNodes.has(ctx.root)) {
            lifeCycleNodes.set(ctx.root, ctx);
            ctx.created && ctx.created(ctx.root);
        }
    },
    /**
     * Initializes the life-cycle hooks for a given node.
     * @param node The node to initialize its life-cycle hooks.
     * @param ctx `TemplateContext` which holds life-cycle handlers for the node.
     */
    init(ctx: TemplateContext) {
        // Creation life-cycle handler - only once.
        if (!lifeCycleNodes.has(ctx.root)) {
            lifeCycleNodes.set(ctx.root, ctx);
            ctx.created && ctx.created(ctx.root);
        }

        // Process the rendered hook for the node.
        rendered(ctx);
    },
    /**
     * Kicks off the observation via `MutationObserver` to listen for DOM tree adds/removals.
     * @param node The App node to observe for changes in its DOM tree.
     */
    observe(observableNode: Node) {
        const observer = new MutationObserver(domChanged);

        // Execute all the `onMounted` handlers since all the nodes are now in the DOM.
        lifeCycleNodes.forEach((ctx, node) => {
            if (document.contains(ctx.root)) {
                ctx.mounted && ctx.mounted(ctx.root);
            } else {
                lifeCycleNodes.delete(node);
            }
        });

        // Observe future DOM updates.
        observer.observe(observableNode, { childList: true, subtree: true });
    },
    preRender(ctx: TemplateContext) {
        // Before-rendered life-cycle handler - called on every render.
        ctx.beforeRender && ctx.beforeRender(ctx.root);
    },
    postRender(ctx: TemplateContext) {
        // Rendered life-cycle handler - called on every render.
        ctx.rendered && ctx.rendered(ctx.root);
    }
};

// Holds reference to the life-cycle handlers for each component node.
const lifeCycleNodes = new Map<Node, TemplateContext>();

/**
 * Calls the `onRender` life-cycle handler if defined.
 * @param node The rendered node.
 */
const rendered = (ctx: TemplateContext) =>
    // Rendered life-cycle handler - called on every render.
    ctx.rendered && ctx.rendered(ctx.root);
