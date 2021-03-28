import { template } from './template';
import { ComponentFunction } from './types';

export const component: ComponentFunction = (renderFunction) => (props) => (
    ctx = {}
) => {
    const renderProps = Object.assign({}, props, { node: ctx.root });

    ctx.render = ctx.render || template.bind(ctx);
    return renderFunction(ctx.render, renderProps);
};
