import { getTemplateRoot } from './helpers';
import { taggedTemplate } from './template';
import {
    ComponentContext,
    ComponentContextPartial,
    ComponentDefaultProps,
    ComponentFactory,
    ContextNodeGetter,
    LifeCycleHandler,
    LifeCycleHook,
    LifeCycleHookProps,
    RefContext,
    TaggedTemplate
} from './types';

/**
 * Hooks up a template w/ the framework system.
 * @param renderFunction A component template.
 * @returns A component factory - caches the component instance returning the cached instance
 *      when the component's root node still exists in the DOM.
 */
export const component: ComponentFactory =
    (renderFunction) =>
    // Component (component factory)
    (props) =>
    // ContextFunction - it receives a new or existing `ComponentContext`.
    (ctx = {}) => {
        // Holds any possible child `RefContext`s.
        let refIterator: IterableIterator<RefContext>;

        // Ensures the template context is fresh during 1st render &
        // whenever the fingerprint doesn't match the render function.
        if (ctx.fingerPrint !== renderFunction) {
            const ref = props?.ref;
            let key: keyof ComponentContext;

            // Reset the template context, but maintain the reference.
            for (key in ctx) {
                delete ctx[key];
            }

            ctx.fingerPrint = renderFunction;
            ctx.lifeCycles = {
                onBeforeRender: getLifeCycleHook(ctx, 'beforeRender'),
                onCreated: getLifeCycleHook(ctx, 'created'),
                onMounted: getLifeCycleHook(ctx, 'mounted'),
                onRendered: getLifeCycleHook(ctx, 'rendered'),
                onUnmounted: getLifeCycleHook(ctx, 'unmounted')
            };
            ctx.node = () => getTemplateRoot(ctx.root);
            // Holds all the created refs for the current component `ComponentContext`.
            ctx.refs = new Set<RefContext>();
            // Caches the context w/ the template engine (tagged template.)
            ctx.render = taggedTemplate.bind(ctx) as TaggedTemplate;

            if (ref) {
                // Set component's received `RefContext` prop onto the the current component `ComponentContext`.
                // This creates a connection between part of this context & a component ascendant that needs
                // a reference to it.
                ctx.ref = ref;
                ctx.ref.node = ctx.node;
                ctx.beforeRender = ctx.ref.beforeRender;
                ctx.created = ctx.ref.created;
                ctx.mounted = ctx.ref.mounted;
                ctx.rendered = ctx.ref.rendered;
                ctx.unmounted = ctx.ref.unmounted;
                delete props.ref;
            }
        }

        refIterator = (ctx.refs as Set<RefContext>).values();

        /*
         * ```
         * component(
         *    // This is the render function that gets called now.
         *    (html, {}) => html`<h1>Hello World!</h1>`
         * );
         * ```
         */
        return renderFunction(
            // html`...` tagged template
            ctx.render as TaggedTemplate,
            // Props
            Object.assign<any, ComponentDefaultProps>(props, {
                ...(ctx.lifeCycles as LifeCycleHookProps),
                ctx: memoizedRefContext(ctx, refIterator),
                ctxRefs: () => (ctx.refs as Set<RefContext>).values(),
                node: ctx.node as ContextNodeGetter
            })
        );
    };

// This returns the hook which will wrap a handler
// or handler group (when a parent component registers a handler for a child-`RefContext`.)
const getLifeCycleHook =
    (
        ctx: Partial<ComponentContext>,
        eventName: keyof Pick<
            ComponentContext,
            'beforeRender' | 'created' | 'mounted' | 'rendered' | 'unmounted'
        >
    ): LifeCycleHook =>
    // The returned hook.
    (handler: LifeCycleHandler) => {
        const getEvent = () =>
            ctx.ref?.[eventName] !== undefined
                ? ctx.ref?.[eventName]
                : undefined;
        const event = getEvent();

        ctx[eventName] =
            typeof event === 'function'
                ? // Process the component lifecycle event for the component, then the `RefContext` owner.
                  (node) => handler(node) & event(node)
                : // Process the component lifecycle event.
                  handler;
    };

/**
 * Ensures the ref context is never lost.
 * This allows a component to create many ref contexts w/o losing them on re-renders.
 * @param ctx The cached/scoped template context
 * @param iterator This is the `Iterator` of cached refs to traverse & return.
 *      If the list is empty, new ones will be created & cached for future renders.
 * @returns RefContext
 */
const memoizedRefContext =
    (ctx: ComponentContextPartial, iterator: IterableIterator<RefContext>) =>
    // This is the `ctx` prop which is provided to each component & returns the `RefContext`.
    () => {
        let ref: RefContext = iterator.next().value;

        if (ref) {
            return ref;
        }

        ref = refContext();
        ctx.refs?.add(ref);

        return ref;
    };

/**
 * Creates a reference which can be hooked into by the nested component which receives
 * this as the prop, `ref`. Use this reference to hook into the component-of-context's life-cycle
 * & gain access to its root node.
 * Handler props are added once the hook is called so that it can be referenced for later execution.
 * @returns Access to the nested component which receives this reference.
 */
const refContext = (): RefContext => ({
    onBeforeRender(handler) {
        this.beforeRender = handler;
    },
    onCreated(handler) {
        this.created = handler;
    },
    onMounted(handler) {
        this.mounted = handler;
    },
    onRendered(handler) {
        this.rendered = handler;
    },
    onUnmounted(handler) {
        this.unmounted = handler;
    }
});
