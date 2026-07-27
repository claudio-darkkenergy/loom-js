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
        value.name.toLowerCase().endsWith('contextfunction')
    ) {
        let childCtx = parentCtx.children.get(key);

        if (!childCtx) {
            childCtx = {} as ComponentContextPartial;
            parentCtx.children.set(key, childCtx);
        }

        childCtx.parent = parentCtx;
        return childCtx;
    } else if (!(value instanceof Node)) {
        // A non-`ContextFunction` value replaced a component in this slot, so its
        // child context is stale — drop it.
        //
        // Resolved DOM `Node`s are exempt: an `activity.effect(...)` subtree is
        // reconciled first by the effect itself (with its context functions) &
        // then re-visited by the outer `${...}` interpolation with the *already
        // resolved* nodes. That 2nd pass carries no keys, so it falls back to the
        // index keyspace & would otherwise delete the child context of a keyed
        // item whose key happens to equal an index (e.g. numeric keys).
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
