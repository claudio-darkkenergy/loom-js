import { getContextRootAnchor } from './helpers';
import { loomConsole } from '../globals/loom-console';
import { reactive, updateEffect } from '../reactive';
import { canDebug } from '../../config';
import type {
    ComponentContextPartial,
    LifeCycleHandler,
    LifeCycleHandlerProps,
    LifeCycleHookProps,
    LifeCycleState
} from '../../types';

// Holds reference to the life-cycle handlers for each component node.
const lifeCycleNodes = new Map<Node, ComponentContextPartial>();

/*
 * Life-cycle hooks occur in the following order:
 *      1. Created - once per component creation.
 *      2. Before Render - called before the component renders.
 *      2. Rendered - 1st time a component is rendered,
 *                  - again for every `effect` update after the 1st one.
 *      -- Note: `onAppMounted` is called here before the next life-cycle hooks are called.
 *      3. Mounted - nodes are connected to the DOM,
 *                 - processed for each component from the queue, 1st-in/out, during the 1st mounted cycle,
 *                 - & again when new nodes are mounted, observed by the `MutationObserver`.
 *      4. Unmounted - nodes are disconnected from the DOM,
 *                   - processed for each component, observed by the `MutationObserver`.
 */
export const _lifeCycles = {
    /**
     * Initializes the life-cycle hooks for a given node.
     * The component has been created, but not mounted.
     * @param ctx `ComponentContextPartial` which holds life-cycle handlers for the node.
     */
    creation(ctx: ComponentContextPartial) {
        // Creation life-cycle handler - only once.
        if (ctx.lifeCycleState) {
            // Creation life-cycle handler - only once.
            const root = getContextRootAnchor(ctx);

            if (root && !lifeCycleNodes.has(root)) {
                lifeCycleNodes.set(root, ctx);

                ctx.lifeCycleState.value = 'created';
            }
        }
    },
    /**
     * Kicks off the observation via `MutationObserver` to listen for DOM tree adds/removals.
     * @param observableNode The App node to observe for changes in its DOM tree.
     */
    observe(observableNode: Element) {
        const observer = new MutationObserver(domChanged);

        // Execute all the `onMounted` handlers since all the nodes are now in the DOM.
        lifeCycleNodes.forEach((ctx, node) => {
            const root = getContextRootAnchor(ctx);

            if (root && document.contains(root) && ctx.lifeCycleState) {
                ctx.lifeCycleState.value = 'mounted';
                canDebug('mounted') &&
                    loomConsole.info('loom (Mounted)', node, {
                        ...ctx
                    });
            } else {
                lifeCycleNodes.delete(node);
            }
        });

        // Observe future DOM updates.
        observer.observe(observableNode, { childList: true, subtree: true });
    },
    preRender(ctx: ComponentContextPartial) {
        // Before-rendered life-cycle handler - called on every render.
        if (ctx.lifeCycleState) {
            ctx.lifeCycleState.value = 'beforeRender';
        }
    },
    postRender(ctx: ComponentContextPartial) {
        // Rendered life-cycle handler - called on every render.
        if (ctx.lifeCycleState) {
            ctx.lifeCycleState.value = 'rendered';
        }
    }
};

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

                        if (ctx?.lifeCycleState) {
                            lifeCycleNodes.delete(node);
                            ctx.lifeCycleState.value = 'unmounted';
                            canDebug('unmounted') &&
                                loomConsole.info('loom (Unmounted)', node, {
                                    ...ctx
                                });
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

                        if (ctx?.lifeCycleState) {
                            ctx.lifeCycleState.value = 'mounted';
                            canDebug('mounted') &&
                                loomConsole.info('loom (Mounted)', node, {
                                    ...ctx
                                });
                        }
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
 *      1. Created - once per component creation.
 *      2. Before Render - called before the component renders.
 *      3. Rendered - 1st time a component is rendered,
 *                  - again for every `effect` update after the 1st one.
 *      -- Note: `onAppMounted` is called here before the next life-cycle hooks are called.
 *      4. Mounted - nodes are connected to the DOM,
 *                 - processed for each component from the queue, 1st-in/out, during the 1st mounted cycle,
 *                 - & again when new nodes are mounted, observed by the `MutationObserver`.
 *      5. Unmounted - nodes are disconnected from the DOM,
 *                   - processed for each component, observed by the `MutationObserver`.
 */
export const lifeCycles: (
    ctx: ComponentContextPartial
) => LifeCycleHookProps = (ctx) => {
    const lifeCycleState = reactive({
        value: null
    }) as LifeCycleState;

    updateEffect(
        (state) => lifeCycleStateUpdateEffect(ctx, state),
        lifeCycleState
    );
    ctx.lifeCycleState = lifeCycleState;

    return {
        onBeforeRender(handler) {
            !ctx.beforeRender &&
                createLifeCycleHook('beforeRender', { ctx, handler });
        },
        onCreated(handler) {
            !ctx.created && createLifeCycleHook('created', { ctx, handler });
        },
        onMounted(handler) {
            !ctx.mounted && createLifeCycleHook('mounted', { ctx, handler });
        },
        onRendered(handler) {
            !ctx.rendered && createLifeCycleHook('rendered', { ctx, handler });
        },
        onUnmounted(handler) {
            !ctx.unmounted &&
                createLifeCycleHook('unmounted', { ctx, handler });
        }
    };
};

// Creates the hook which will wrap life-cycle handler
// or handler group (when a parent component registers a handler for a child-`RefContext`.)
// When a handler group is included, the scoped component handler will be triggered,
// then the child-`RefContext` handler will be.
const createLifeCycleHook = (
    eventName: keyof LifeCycleHandlerProps,
    {
        ctx,
        handler
    }: { ctx: ComponentContextPartial; handler: LifeCycleHandler }
) => {
    const event = ctx.ref?.[eventName];
    ctx[eventName] =
        typeof event === 'function'
            ? (root) => handler(root) & event(root)
            : handler;
};

const lifeCycleStateUpdateEffect = (
    ctx: ComponentContextPartial,
    state: LifeCycleState
) => {
    const currentState = state.value;

    switch (currentState) {
        case 'created':
            ctx.created?.(ctx.root);
            break;
        case 'beforeRender':
            ctx.beforeRender?.(ctx.root);
            break;
        case 'rendered':
            ctx.rendered?.(ctx.root);
            break;
        case 'mounted':
            ctx.mounted?.(ctx.root);
            break;
        case 'unmounted':
            ctx.unmounted?.(ctx.root);
            break;
    }
};
