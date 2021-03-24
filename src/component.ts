import { template } from './template';
import { ComponentFunction } from './types';

export const component: ComponentFunction = (
    renderFunction,
    ...onRenderHandlers
) => (props = {}) => (ctx = {}) => {
    ctx.render = ctx.render || template.bind(ctx);
    const node = renderFunction(ctx.render, { ...props });

    // Call the `onRenderHandlers` once the node has been properly rendered.
    onRenderHandlers.forEach((onRender) => onRender(node, { ...props }));

    return node;
};
