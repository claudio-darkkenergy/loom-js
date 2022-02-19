import {
    ActivityEffect,
    ActivityHandler,
    ActivityTransform,
    AsyncComponentNode,
    ComponentNode,
    TemplateContext
} from './types';

export const activity = <V = undefined, I = V>(
    initialValue: V = undefined,
    transform?: ActivityTransform<V, I>
) => {
    let currentValue = initialValue;
    const liveNodes = new Map<
        Node,
        {
            action: ActivityHandler<V>;
            // @TODO Use the cache for handler memoization.
            cache: any[];
            ctx: TemplateContext;
        }
    >();
    const effect: ActivityEffect<V> =
        (action, cache = []) =>
        // Returning a `ContextFunction` so a `TemplateContext` can be passed into it later on.
        // This helps w/ rerenders of non-specified `component`s (when `component` wasn't used for the component.)
        (ctx = {}) => {
            const node = renderComponent({ action, ctx, value: currentValue });

            liveNodes.set(node, { action, cache, ctx });
            return node;
        };
    const update = (valueInput: I, force = false) =>
        typeof transform === 'function'
            ? transform(
                  {
                      input: valueInput,
                      update: updateActivity,
                      value: currentValue
                  },
                  force
              )
            : updateActivity(valueInput as unknown as V, force);

    function updateActivity(newValue: V, force = false) {
        Array.from(liveNodes.entries()).forEach(
            async ([liveNode, { action, cache, ctx }]) => {
                if (!document.contains(liveNode)) {
                    // Cleanup old nodes which have been removed from the DOM.
                    liveNodes.delete(liveNode);
                } else if (
                    newValue !== currentValue ||
                    force
                    // Do the updates.
                ) {
                    const node = renderComponent({
                        action,
                        ctx,
                        value: newValue
                    });

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
                }
            }
        );

        currentValue = newValue;
    }

    function renderComponent<V>({
        action,
        ctx,
        value
    }: {
        action: ActivityHandler<V>;
        ctx: TemplateContext;
        value: V;
    }) {
        const result = action({ value });
        const ctxFunction =
            typeof result !== 'function'
                ? () => result || document.createTextNode('')
                : result;
        let node = ctxFunction(ctx) as Node;
        const isAsyncNode = node instanceof Promise;

        if (isAsyncNode) {
            node = document.createTextNode('');
        }

        isAsyncNode &&
            (result as AsyncComponentNode)().then((componentNode) =>
                renderAsync({ componentNode, liveNode: node })
            );
        return node;
    }

    function renderAsync({
        componentNode,
        liveNode
    }: {
        componentNode: ComponentNode;
        liveNode: Node;
    }) {
        const liveNodeData = liveNodes.get(liveNode);

        if (liveNodeData) {
            const ctxFunction =
                typeof componentNode !== 'function'
                    ? () => componentNode || document.createTextNode('')
                    : componentNode;
            const asyncNode = ctxFunction(liveNodeData.ctx);

            if (asyncNode && !asyncNode.isSameNode(liveNode)) {
                liveNodes.set(asyncNode, liveNodeData);
                // Replace the old node & perform cleanup on it for garbage colleciton.
                (liveNode as Element).replaceWith(asyncNode);
                liveNodes.delete(liveNode);
            }
        }
    }

    return {
        effect,
        initialValue,
        update,
        value: () => currentValue
    };
};
