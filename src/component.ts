import { taggedTemplate } from './template';
import {
    ComponentFunction,
    LifeCycleHandler,
    LifeCycleHandlerProps,
    RefContext,
    TemplateContext
} from './types';

export const component: ComponentFunction =
    (renderFunction) =>
    // Component
    (props) =>
    // ContextFunction
    (ctx = {}) => {
        const lifeCycles: LifeCycleHandlerProps = {
            onCreated: getLifeCycleHandler(ctx, 'created'),
            onMounted: getLifeCycleHandler(ctx, 'mounted'),
            onRendered: getLifeCycleHandler(ctx, 'rendered'),
            onUnmounted: getLifeCycleHandler(ctx, 'unmounted')
        };
        let refIterator: IterableIterator<RefContext>;
        // Ensures the ref context is never lost.
        const memoizedRefContext = () => {
            let ref = refIterator.next().value as RefContext;

            if (ref) {
                return ref;
            }

            ref = refContext();
            ctx.refs.add(ref);

            return ref;
        };

        // Ensures the template context is fresh during 1st render &
        // whenever the fingerprint doesn't match the render function.
        if (ctx.fingerPrint !== renderFunction) {
            const ref = props?.ref;

            // Reset the template context, but maintain the reference.
            for (const key in ctx) {
                delete ctx[key];
            }

            ctx.fingerPrint = renderFunction;
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
            }
        }

        refIterator = ctx.refs.values();

        return renderFunction(
            ctx.render,
            Object.assign({}, props, {
                ...lifeCycles,
                ctx: memoizedRefContext,
                node: ctx.node
            })
        );
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

const getLifeCycleHandler =
    (ctx: TemplateContext, eventName: string) =>
    (handler: LifeCycleHandler) => {
        const event: LifeCycleHandler = ctx[eventName];
        ctx[eventName] = event
            ? // Process the component lifecycle event for the component, then the `RefContext` owner.
              (((node) => handler(node) & event(node)) as LifeCycleHandler)
            : // Process the component lifecycle event.
              handler;
    };
