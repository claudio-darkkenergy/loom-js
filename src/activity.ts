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
            ctxFunction: ContextFunction;
        }
    >();
    const effect: ActivityEffect<T> = (action, cache = []) => {
        const ctxFunction = action({ value: initialValue });
        const ctx: TemplateContext = {};
        const node = ctxFunction(ctx);

        liveNodes.set(node, { action, cache, ctx, ctxFunction });
        return node;
    };

    return {
        effect,
        initialValue,
        update(newValue: T) {
            Array.from(liveNodes.entries()).forEach(
                ([node, { action, ctx, ctxFunction }]) => {
                    if (document.contains(node) && newValue !== currentValue) {
                        currentValue = newValue;
                        ctxFunction = action({ value: newValue });
                        ctxFunction(ctx);
                    } else {
                        // Cleanup old nodes which have been removed from the DOM.
                        liveNodes.delete(node);
                    }
                }
            );
        },
        value() {
            return currentValue;
        }
    };
};
