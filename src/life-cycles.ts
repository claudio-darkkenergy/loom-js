import { TemplateContext } from './types';

const lifeCycleNodes = new Map<Node, TemplateContext>();

export const lifeCycles = {
    init(node: Node, ctx: TemplateContext) {
        // Creation life-cycle handler - only once.
        if (!lifeCycleNodes.has(node)) {
            lifeCycleNodes.set(node, ctx);
            // Mounted life-cycle handler - append to the life-cycle "mounted" queue.
            ctx.mounted && mountedHandlerQueue.add(() => ctx.mounted(node));
            ctx.created && ctx.created(node);
        }

        rendered(node);
    },
    observe(node: Node) {
        const observer = new MutationObserver(domChanged);

        // Execute all the handlers since all the nodes are now in the DOM.
        mountedHandlerQueue.forEach((handler) => handler());
        // Observe future DOM updates.
        observer.observe(node, { childList: true });
    }
};

const domChanged: MutationCallback = (diffNodes) =>
    diffNodes.forEach((node) => {
        switch (node.type) {
            case 'childList':
                node.removedNodes.forEach((node) => {
                    lifeCycleNodes.get(node)?.unmounted(node);
                    lifeCycleNodes.delete(node);
                });

                node.addedNodes.forEach((node) =>
                    lifeCycleNodes.get(node)?.mounted(node)
                );
        }
    });

// The life-cycle "mounted" queue to call once the App has been appended to the DOM
// & therefore, all the other nodes have been appended to the DOM, as well.
const mountedHandlerQueue = new Set<() => any>();

const rendered = (node: Node) => {
    if (lifeCycleNodes.has(node)) {
        const ctx = lifeCycleNodes.get(node);
        // Rendered life-cycle handler - every render.
        ctx.rendered && ctx.rendered(node);
    }
};
