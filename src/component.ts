import { template } from './template';
import {
    ComponentFunction,
    LifeCycleHandler,
    LifeCycleHandlerProps,
    RefContext
} from './types';

export const ctx: () => RefContext = () => ({
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

export const component: ComponentFunction =
    (renderFunction) =>
    // Component
    (props) =>
    // ContextFunction
    (ctx = {}) => {
        let node: Node;
        const lifeCycles: LifeCycleHandlerProps = {
            onCreated: (handler: LifeCycleHandler) => {
                ctx.created = ctx.created
                    ? (...args) => handler(...args) & ctx.created(...args)
                    : handler;
            },
            onMounted: (handler: LifeCycleHandler) => {
                ctx.mounted = ctx.mounted
                    ? (...args) => handler(...args) & ctx.mounted(...args)
                    : handler;
            },
            onRendered: (handler: LifeCycleHandler) => {
                ctx.rendered = ctx.rendered
                    ? (...args) => handler(...args) & ctx.rendered(...args)
                    : handler;
            },
            onUnmounted: (handler: LifeCycleHandler) => {
                ctx.unmounted = ctx.unmounted
                    ? (...args) => handler(...args) & ctx.unmounted(...args)
                    : handler;
            }
        };
        
        // Ensures the template context is fresh during 1st render &
        // whenever the fingerprint doesn't match the render function.
        if (ctx.fingerPrint !== renderFunction) {
            // Reset the template context, but maintain the reference.
            for (const key in ctx) {
                delete ctx[key];
            }

            ctx.fingerPrint = renderFunction;
            ctx.node = () => ctx.root;
            ctx.ref = props.ref;
            ctx.render = template.bind(ctx);
    
            if (ctx.ref) {
                ctx.ref.node = ctx.node;
                ctx.created = ctx.ref.created;
                ctx.mounted = ctx.ref.mounted;
                ctx.rendered = ctx.ref.rendered;
                ctx.unmounted = ctx.ref.unmounted;
            }
        }

        node = renderFunction(
            ctx.render,
            Object.assign({}, props, {
                ...lifeCycles,
                node: ctx.node
            })
        );
        
        return node;
    };
