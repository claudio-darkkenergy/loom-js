import { taggedTemplate } from './template';
import {
    ComponentFunction,
    LifeCycleHandler,
    LifeCycleListener,
    RefContext,
    TemplateContext
} from './types';

/**
 * Hooks up a template w/ the framework system.
 * @param renderFunction A component template.
 * @returns A component factory - caches the component instance returning the cached instance
 *      when the component's root node still exists in the DOM.
 */
export const component: ComponentFunction =
    (renderFunction) =>
    // Component (component factory)
    (props) =>
    // ContextFunction
    (ctx = {}) => {
        let refIterator: IterableIterator<RefContext>;

        // Ensures the template context is fresh during 1st render &
        // whenever the fingerprint doesn't match the render function.
        if (ctx.fingerPrint !== renderFunction) {
            const ref = props?.ref;

            // Reset the template context, but maintain the reference.
            for (const key in ctx) {
                delete ctx[key];
            }

            ctx.fingerPrint = renderFunction;
            ctx.lifeCycles = {
                onCreated: getLifeCycleHandler(ctx, 'created'),
                onMounted: getLifeCycleHandler(ctx, 'mounted'),
                onRendered: getLifeCycleHandler(ctx, 'rendered'),
                onUnmounted: getLifeCycleHandler(ctx, 'unmounted')
            };
            ctx.node = () => ctx.root;
            // Holds all the created refs for the current component `TemplateContext`.
            ctx.refs = new Set<RefContext>();
            ctx.render = taggedTemplate.bind(ctx);

            if (ref) {
                // Set component's received `RefContext` prop onto the the current component `TemplateContext`.
                // This creates a connection between part of this context & a component ascendant that needs
                // a reference to it.
                ctx.ref = ref;
                ctx.ref.node = ctx.node;
                ctx.created = ctx.ref.created;
                ctx.mounted = ctx.ref.mounted;
                ctx.rendered = ctx.ref.rendered;
                ctx.unmounted = ctx.ref.unmounted;
                delete props.ref;
            }
        }

        refIterator = ctx.refs.values();

        return renderFunction(
            ctx.render,
            Object.assign({}, props, {
                ...ctx.lifeCycles,
                ctx: memoizedRefContext(ctx, refIterator),
                node: ctx.node
            })
        );
    };

const getLifeCycleHandler =
    (ctx: TemplateContext, eventName: string): LifeCycleListener =>
    (handler: LifeCycleHandler) => {
        let event: LifeCycleHandler;

        if (ctx.ref) {
            event = ctx.ref[eventName];
        }

        ctx[eventName] = event
            ? // Process the component lifecycle event for the component, then the `RefContext` owner.
              (((node) => handler(node) & event(node)) as LifeCycleHandler)
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
    (ctx: TemplateContext, iterator: IterableIterator<RefContext>) => () => {
        let ref = iterator.next().value as RefContext;

        if (ref) {
            return ref;
        }

        ref = refContext();
        ctx.refs.add(ref);

        return ref;
    };

/**
 * Creates a reference which can be hooked into by the nested component which receives
 * this as the prop, `ref`. Use this reference to hook into the component-of-context's life-cycle
 * & gain access to its root node.
 * @returns Access to the nested component which receives this reference.
 */
const refContext = (): RefContext => ({
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
        this.unmouned = handler;
    }
});
