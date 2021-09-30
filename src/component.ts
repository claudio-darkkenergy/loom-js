import { template } from './template';
import { ComponentFunction, LifeCycleHandler, LifeCycleState } from './types';

export const component: ComponentFunction =
    (renderFunction) =>
    // Component
    (props) =>
    // ContextFunction
    (ctx = {}) => {
        // Ensures the template context is fresh during 1st render &
        // whenever the fingerprint doesn't match the render function.
        if (ctx.fingerPrint !== renderFunction) {
            // Reset the template context, but maintain the reference.
            for (const key in ctx) {
                delete ctx[key];
            }

            ctx.fingerPrint = renderFunction;
            ctx.node = () => ctx.root;
            ctx.render = template.bind(ctx);
        }

        return renderFunction(
            ctx.render,
            Object.assign({}, props, {
                node: ctx.node,
                onCreated: (handler: LifeCycleHandler) => {
                    ctx.created = handler;
                },
                onMounted: (handler: LifeCycleHandler) => {
                    ctx.mounted = handler;
                },
                onRendered: (handler: LifeCycleHandler<LifeCycleState>) => {
                    ctx.rendered = handler;
                },
                onUnmounted: (handler: LifeCycleHandler) => {
                    ctx.unmounted = handler;
                }
            })
        );
    };
