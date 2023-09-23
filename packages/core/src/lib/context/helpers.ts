import type {
    ComponentContextPartial,
    TemplateRoot,
    TemplateTagValue
} from '../../types';

export const appendChildContext = (
    parentCtx: ComponentContextPartial = {},
    value: TemplateTagValue,
    i: number
) => {
    if (Array.isArray(parentCtx.children)) {
        let childCtx = parentCtx.children[i];

        if (typeof value === 'function' && value.name === 'contextFunction') {
            if (!childCtx) {
                childCtx = {} as ComponentContextPartial;
                parentCtx.children.push(childCtx);
            }

            childCtx.parent = parentCtx;
        }

        return childCtx;
    }
};

export const getContextRootAnchor = (ctx: ComponentContextPartial) =>
    Array.isArray(ctx.root) ? ctx.root[0] : (ctx.root as TemplateRoot);
