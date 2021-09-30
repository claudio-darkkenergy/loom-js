import { TemplateContext } from './types';

/**
 * The `MutationCallback` to get call by the `MutationObserver` on DOM mutations.
 * @param diffNodes The nodes which have been added or removed from the DOM.
 */
const domChanged: MutationCallback = (diffNodes) =>
    diffNodes.forEach((node) => {
        switch (node.type) {
            case 'childList':
                // Calls the `onUnmounted` life-cycle handler for each removed node if defined.
                node.removedNodes.forEach((node) => {
                    const handler = lifeCycleNodes.get(node)?.unmounted;

                    handler && handler(node, {});
                    lifeCycleNodes.delete(node);
                });

                // Calls the `onMounted` life-cycle handler for each added node if defined.
                node.addedNodes.forEach((node) => {
                    const ctx = lifeCycleNodes.get(node);
                    const handler = ctx?.mounted;

                    if (ctx) {
                        ctx.connected = true;
                    }

                    handler && handler(node, {});
                });
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
     * @param node The node to initialize its life-cycles hooks.
     * @param ctx `TemplateContext` which holds life-cycle handlers for the node.
     */
    init(node: Node, ctx: TemplateContext) {
        // Creation life-cycle handler - only once.
        if (!lifeCycleNodes.has(node)) {
            lifeCycleNodes.set(node, ctx);
            // Mounted life-cycle handler - append to the life-cycle "mounted" queue.
            ctx.mounted &&
                mountedHandlerQueue.add(() => {
                    if (lifeCycleNodes.has(node)) {
                        ctx.connected = true;
                        ctx.mounted(node, {});
                    }
                });
            ctx.created && ctx.created(node, {});
        }

        // Process the rendered hook for the node.
        rendered(node);
    },
    /**
     * Kicks off the observation via `MutationObserver` to listen for DOM tree adds/removals.
     * @param node The App node to observe for changes in its DOM tree.
     */
    observe(node: Node) {
        const observer = new MutationObserver(domChanged);

        // Execute all the handlers since all the nodes are now in the DOM.
        mountedHandlerQueue.forEach((handler) => handler());
        // Observe future DOM updates.
        observer.observe(node, { childList: true });
    }
};

// Holds reference to the life-cycle handlers for each component node.
const lifeCycleNodes = new Map<Node, TemplateContext>();

// The life-cycle "mounted" queue to call once the App has been appended to the DOM
// & therefore, all the other nodes have been appended to the DOM, as well.
const mountedHandlerQueue = new Set<() => any>();

/**
 * Calls the `onRender` life-cycle handler if defined.
 * @param node The rendered node.
 */
const rendered = (node: Node) => {
    const ctx = lifeCycleNodes.get(node);
    const handler = ctx?.rendered;
    // Rendered life-cycle handler - called on every render.
    handler && handler(node, { mounted: !!ctx?.connected || false });
};
