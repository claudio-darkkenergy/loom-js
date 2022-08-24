import { getTemplateRoot } from './helpers';
import {
    ActivityEffect,
    ActivityHandler,
    ActivityTransform,
    AsyncComponentNode,
    ComponentNode,
    TemplateContext,
    TemplateRoot
} from './types';

interface ActivityLiveNodeData<V> {
    action: ActivityHandler<V>;
    // @TODO Use the cache for handler memoization.
    cache: any[];
    ctx: TemplateContext;
}

type ActivityLiveNodes<V> = Map<TemplateRoot, ActivityLiveNodeData<V>>;

export const activity = <V = undefined, I = V>(
    initialValue: V = undefined,
    transform?: ActivityTransform<V, I>
) => {
    let currentValue = initialValue;
    const liveNodes: ActivityLiveNodes<V> = new Map();
    const effect: ActivityEffect<V> =
        (action, cache = []) =>
        // Returning a `ContextFunction` so a `TemplateContext` can be passed into it later on.
        // This helps w/ rerenders of non-specified `component`s (when `component` wasn't used for the component.)
        (ctx = {}) => {
            const rootNode = renderComponent({
                action,
                ctx,
                value: currentValue
            });

            liveNodes.set(rootNode, { action, cache, ctx });
            return rootNode;
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
                const liveRootNode = getTemplateRoot(liveNode);

                if (!document.contains(liveRootNode)) {
                    // Cleanup old nodes which have been removed from the DOM.
                    liveNodes.delete(liveNode);
                } else if (
                    newValue !== currentValue ||
                    force
                    // Do the updates.
                ) {
                    // Render the component.
                    const node = renderComponent({
                        action,
                        ctx,
                        value: newValue
                    });

                    // Update the live node(s).
                    doLiveNodeUpdates<V>({
                        liveNode,
                        liveNodeData: {
                            action,
                            cache,
                            ctx
                        },
                        liveNodes,
                        newNode: node
                    });
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
        let rootNode = ctxFunction(ctx) as TemplateRoot;
        const isAsyncNode = rootNode instanceof Promise;

        if (isAsyncNode) {
            // Create a temporary node to be replaced w/ once async node resolves.
            rootNode = document.createTextNode('');
        }

        isAsyncNode &&
            (result as AsyncComponentNode)().then((componentNode) =>
                renderAsync({ componentNode, liveNode: rootNode })
            );
        return rootNode;
    }

    function renderAsync({
        componentNode,
        liveNode
    }: {
        componentNode: ComponentNode;
        liveNode: TemplateRoot;
    }) {
        const liveNodeData = liveNodes.get(liveNode);

        if (liveNodeData) {
            const ctxFunction =
                typeof componentNode !== 'function'
                    ? () => componentNode || document.createTextNode('')
                    : componentNode;
            const asyncNode = ctxFunction(liveNodeData.ctx);

            // Update the live node(s).
            doLiveNodeUpdates<V>({
                liveNode,
                liveNodeData,
                liveNodes,
                newNode: asyncNode
            });
        }
    }

    return {
        effect,
        initialValue,
        reset: () => updateActivity(initialValue),
        update,
        value: () => currentValue
    };
};

const doLiveNodeUpdates = <V>({
    liveNodeData,
    liveNode,
    liveNodes,
    newNode
}: {
    liveNodeData: ActivityLiveNodeData<V>;
    liveNode: TemplateRoot;
    liveNodes: ActivityLiveNodes<V>;
    newNode: TemplateRoot;
}) => {
    const areNodeLists =
        liveNode instanceof NodeList && newNode instanceof NodeList;
    const nodesChanged = !(newNode as Node).isSameNode(liveNode as Node);

    // Update the live node.
    if (newNode && (areNodeLists || nodesChanged)) {
        // Cache the node & live-node data.
        liveNodes.set(newNode, liveNodeData);

        if (areNodeLists) {
            const fragment = document.createDocumentFragment();
            const liveRootNode = liveNode[0].parentElement;

            // Perform the updates
            fragment.replaceChildren(...Array.from(newNode));
            liveRootNode.insertBefore(fragment, liveNode[0]);
            // Cleanup the old child nodes.
            liveNode.forEach((liveChildNode) =>
                (liveChildNode as Element).remove()
            );
        } else if (nodesChanged) {
            // Replace the old node w/ the new one...
            (liveNode as Element).replaceWith(newNode as Node);
        }

        // ...& perform cleanup on it for garbage colleciton.
        liveNodes.delete(liveNode);
    }
};
