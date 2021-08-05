import { ActivityEffect, ActivityHandler, TemplateContext } from './types';

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
        const ctx: TemplateContext = {};
        const node = renderComponent({ action, ctx, value: currentValue});

        liveNodes.set(node, { action, cache, ctx });
        return node;
    };
    const update = (newValue: T, force = false) => {
        Array.from(liveNodes.entries()).forEach(
            async ([liveNode, { action, cache, ctx }]) => {
                if (
                    document.contains(liveNode) &&
                    (newValue !== currentValue || force)
                    // Do the updates.
                ) {
                    const node = renderComponent({ action, ctx, value: newValue});

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

        currentValue = newValue;
    };

    function renderComponent<T>({action, ctx, value}: {action: ActivityHandler<T>; ctx: TemplateContext; value: T}) {
        const result = action({ value });
        const ctxFunction =
            typeof result !== 'function' ? () => result : result;
        
        return ctxFunction(ctx);
    }

    return {
        effect,
        // This method is reactive to the parent effect (or router), but not to it's own activity,
        // & therefore is only to be used as a nested effect.
        // The current value of the activity is always returned, &
        // because a component `ContextFunction` is returned instead of a `Node`,
        // the result is to always fully render a component each time it's called.
        rawEffect: (action: ActivityHandler<T>) =>
            (action({ value: currentValue }) as unknown) as Node,
        initialValue,
        update,
        value: () => currentValue
    };
};
