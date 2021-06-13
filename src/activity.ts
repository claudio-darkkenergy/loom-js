import {
    ActivityEffect,
    ActivityHandler,
    ContextFunction,
    TemplateContext
} from './types';

export const activity = <T>(initialValue?: T) => {
    let currentValue = initialValue;
    const liveNodes = new Map<
        Node,
        {
            action: ActivityHandler<T>;
            // @TODO Use the cache for handler memoization.
            cache: any[];
            ctx: TemplateContext;
        }
    >();
    const effect: ActivityEffect<T> = (action, cache = []) => {
        const ctxFunction = action({ value: initialValue });
        const ctx: TemplateContext = {};
        const node = ctxFunction(ctx);

        liveNodes.set(node, { action, cache, ctx });
        return node;
    };

    return {
        effect,
        initialValue,
        update(newValue: T, force = false) {
            Array.from(liveNodes.entries()).forEach(
                async ([liveNode, { action, cache, ctx }]) => {
                    if (
                        document.contains(liveNode) &&
                        (newValue !== currentValue || force)
                    ) {
                        // Do the updates.
                        let ctxFunction: ContextFunction;
                        let node: Node;

                        currentValue = newValue;
                        ctxFunction = await action({ value: newValue });
                        // Render the component.
                        node = ctxFunction(ctx);

                        // If the new node is different than the live node, update the live node.
                        if (node && !node.isSameNode(liveNode)) {
                            liveNodes.set(node, {
                                action,
                                cache,
                                ctx
                            });
                            // Replace the old node & perform cleanup on it for garbage colleciton.
                            (liveNode as Element).replaceWith(node);
                            liveNodes.delete(liveNode);
                        }
                    } else {
                        // Cleanup old nodes which have been removed from the DOM.
                        liveNodes.delete(liveNode);
                    }
                }
            );
        },
        value() {
            return currentValue;
        }
    };
};
