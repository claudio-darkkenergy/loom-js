import { template } from './template';
import { ComponentFunction } from './types';

export const component: ComponentFunction = (renderFunction) => (props) => (
    ctx = {}
) => {
    ctx.node = ctx.node || (() => ctx.root);
    ctx.render = ctx.render || template.bind(ctx);

    return renderFunction(
        ctx.render,
        Object.assign({}, props, { node: ctx.node })
    );
};
