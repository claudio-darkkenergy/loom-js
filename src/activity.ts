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
        const ctxFunction = action({ value: currentValue });

        if (typeof ctxFunction !== 'function') {
            // Then `ctxFunction` is a pure `Node`, so just return it.
            return ctxFunction;
        }

        const ctx: TemplateContext = {};
        const node = ctxFunction(ctx);

        liveNodes.set(node, { action, cache, ctx });
        return node;
    };
    const update = (newValue: T, force = false) => {
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
                    ctxFunction = action({
                        value: newValue
                    }) as ContextFunction;
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
    };

    return {
        effect,
        // This method is reactive to the parent effect (or router), but not to it's own activity,
        // & therefore is only to be used as a nested effect.
        // The current value of the activity is always returned &
        // because a component `ContextFunction` is returned instead of a `Node`,
        // the result is always fully render a component each time it's called.
        rawEffect: (action: ActivityHandler<T>) =>
            (action({ value: currentValue }) as unknown) as Node,
        initialValue,
        update,
        value: () => currentValue
    };
};
