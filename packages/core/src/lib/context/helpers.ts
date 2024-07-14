import type {
    ComponentContextPartial,
    ContextFunction,
    TemplateRoot,
    TemplateTagValue
} from '../../types';

export const appendChildContext = (
    parentCtx: ComponentContextPartial = {},
    value: TemplateTagValue,
    key: number | string
) => {
    parentCtx.children = parentCtx.children || new Map();

    if (
        typeof value === 'function' &&
        ['contextFunction', 'activityContextFunction'].includes(value.name)
    ) {
        let childCtx = parentCtx.children.get(key);

        if (!childCtx) {
            childCtx = {} as ComponentContextPartial;
            parentCtx.children.set(key, childCtx);
        }

        childCtx.parent = parentCtx;
        return childCtx;
    } else {
        parentCtx.children.delete(key);
    }
};

export const getContextForValue = (value: TemplateTagValue) =>
    typeof value === 'function' && value.name === 'contextFunction'
        ? (value as ContextFunction)({}, true)
        : {};

export const getContextRootAnchor = (ctx: ComponentContextPartial) =>
    Array.isArray(ctx.root) ? ctx.root[0] : (ctx.root as TemplateRoot);

export const getShareableContext = (ctx: ComponentContextPartial) =>
    ({
        children: ctx.children,
        chunks: ctx.chunks,
        ctxScopes: ctx.ctxScopes,
        fingerPrint: ctx.fingerPrint,
        fragment: ctx.fragment,
        key: ctx.key,
        lifeCycleState: ctx.lifeCycleState?.value,
        node: ctx.node,
        parent: ctx.parent,
        props: ctx.props,
        root: ctx.root,
        values: ctx.values
    }) as ComponentContextPartial;
