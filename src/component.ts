import { ComponentFunction } from './types';
import { template } from '.';

export const component: ComponentFunction = (
    renderFunction,
    ...onRenderHandlers
) => (props) => (ctx = {}) => {
    ctx.render = ctx.render || template.bind(ctx);
    const node = renderFunction(ctx.render, { ...props });

    // Call the `onRenderHandlers` once the node has been properly rendered.
    onRenderHandlers.forEach((onRendered) => onRendered(node, { ...props }));

    return node;
};
