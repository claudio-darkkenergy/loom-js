import { Template } from './template';
import { ComponentWrapper } from './types';

export const Component: ComponentWrapper = (template) => (
    props = {},
    ctx = {}
) => {
    ctx.render = ctx.render || Template.bind(ctx);
    return template(ctx.render, props);
};
