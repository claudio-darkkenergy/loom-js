import type {
    ComponentContextPartial,
    ContextFunction,
    TemplateRoot,
    TemplateTagValue
} from '../../types';
import { getWindow } from '../dom';

// Array-slot contexts live under a derived key so a slot changing kind
// (component ⇄ array) can never hand one kind's context state to the other.
const arraySlotKey = (key: number | string) => `${key}[]`;

const getPersistentChildContext = (
    parentCtx: ComponentContextPartial,
    key: number | string
) => {
    let childCtx = (
        parentCtx.children as Map<number | string, ComponentContextPartial>
    ).get(key);

    if (!childCtx) {
        childCtx = {} as ComponentContextPartial;
        (
            parentCtx.children as Map<number | string, ComponentContextPartial>
        ).set(key, childCtx);
    }

    childCtx.parent = parentCtx;
    return childCtx;
};

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
        // A context function replaced any array previously in this slot, so the
        // array's slot context is stale — drop it.
        parentCtx.children.delete(arraySlotKey(key));
        return getPersistentChildContext(parentCtx, key);
    } else if (Array.isArray(value)) {
        // Array values need a persistent context too: it carries the `children`
        // map of per-item contexts, so re-reconciling the array reuses each
        // item's live context (& DOM) instead of rebuilding from scratch.
        // An array also replaces whatever component held the plain key.
        parentCtx.children.delete(key);
        return getPersistentChildContext(parentCtx, arraySlotKey(key));
    } else if (!(value instanceof getWindow().Node)) {
        // A primitive value replaced a component or array in this slot, so
        // either child context is stale — drop both.
        //
        // Resolved DOM `Node`s are exempt: an `activity.effect(...)` subtree is
        // reconciled first by the effect itself (with its context functions) &
        // then re-visited by the outer `${...}` interpolation with the *already
        // resolved* nodes. That 2nd pass carries no keys, so it falls back to the
        // index keyspace & would otherwise delete the child context of a keyed
        // item whose key happens to equal an index (e.g. numeric keys).
        parentCtx.children.delete(key);
        parentCtx.children.delete(arraySlotKey(key));
    }
};

// Resolves which kind of context function a template value is, if any. The
// explicit marker set at creation survives minification; the name checks
// keep values from older core copies recognizable.
const contextFunctionKind = (value: TemplateTagValue) =>
    typeof value === 'function'
        ? ((value as ContextFunction).contextFunctionKind ??
          (value.name === 'contextFunction'
              ? 'component'
              : value.name === 'activityContextFunction'
                ? 'activity'
                : undefined))
        : undefined;

/** Detects a context function of either kind (component or activity). */
export const isContextFunction = (
    value: TemplateTagValue
): value is ContextFunction => !!contextFunctionKind(value);

/** Detects an activity effect's context function specifically. */
export const isActivityContextFunction = (
    value: TemplateTagValue
): value is ContextFunction => contextFunctionKind(value) === 'activity';

export const getContextForValue = (value: TemplateTagValue) =>
    // Component context functions only — dry-running an activity context
    // function would leak a subscription.
    contextFunctionKind(value) === 'component'
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
