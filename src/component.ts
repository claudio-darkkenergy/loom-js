import { template } from './template';
import { ComponentFunction, LifeCycleHandler } from './types';

export const component: ComponentFunction = (renderFunction) => (props) => (
    ctx = {}
) => {
    ctx.node = ctx.node || (() => ctx.root);
    ctx.render = ctx.render || template.bind(ctx);

    return renderFunction(
        ctx.render,
        Object.assign({}, props, {
            node: ctx.node,
            onCreated: (handler: LifeCycleHandler) => {
                ctx.created = handler;
            },
            onRendered: (handler: LifeCycleHandler) => {
                ctx.rendered = handler;
            }
        })
    );
};
