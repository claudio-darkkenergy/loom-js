import { ComponentFunction } from './types';
import { template } from '.';

export const component: ComponentFunction = (renderFunction) => (props) => (
    ctx = {}
) => {
    ctx.render = ctx.render || template.bind(ctx);
    return renderFunction(ctx.render, props);
};
