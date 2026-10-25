import type { ComponentContextPartial, TemplateRoot } from '../../types';
import { isAttrBinding } from '../attr-binding';
import { getContextRootAnchor, isLiveContext } from '../context/helpers';
import type { InspectableActivity } from './activity-ref';

/** What a tree node is: a component instance or an activity boundary. */
export type InspectableKind = 'component' | 'effect';

// The root context of every mounted client app. Dead roots are dropped on
// read, so an app removed from the document stops being reported.
const appRoots = new Set<ComponentContextPartial>();

/**
 * Records an app's root context — called by `init` and `hydrate`.
 * @param ctx The root context the app rendered into.
 */
export const registerAppRoot = (ctx: ComponentContextPartial) => {
    appRoots.add(ctx);
};

/**
 * The root contexts of the mounted apps still live in the document.
 * @returns The live app roots, in mount order.
 */
export const getAppRoots = () => {
    appRoots.forEach((ctx) => !isLiveContext(ctx) && appRoots.delete(ctx));

    return Array.from(appRoots);
};

/**
 * Classifies a context: an activity boundary, a component instance, or
 * neither (an array slot's context, which the tree looks through).
 * @param ctx The context to classify.
 * @returns The node kind, or `undefined` for a pass-through context.
 */
export const kindOf = (
    ctx: ComponentContextPartial
): InspectableKind | undefined =>
    ctx.activity ? 'effect' : ctx.fingerPrint ? 'component' : undefined;

const rootNodesOf = (ctx: ComponentContextPartial): TemplateRoot[] =>
    Array.isArray(ctx.root) ? ctx.root : ctx.root ? [ctx.root] : [];

// Collects the live inspectable contexts under `ctx`. Pass-through and
// stale contexts are looked through, so a live descendant attaches to its
// nearest live ancestor.
const collectChildren = (
    ctx: ComponentContextPartial,
    found: Set<ComponentContextPartial>
) => {
    const visit = (child: ComponentContextPartial) => {
        kindOf(child) && isLiveContext(child)
            ? found.add(child)
            : collectChildren(child, found);
    };

    ctx.children?.forEach(visit);
    ctx.arrayChildren?.forEach(visit);
    ctx.ctxScopes?.forEach(visit);
};

/**
 * The live component instances and activity boundaries directly under a
 * context, in document order.
 * @param ctx The parent context.
 * @returns Its inspectable child contexts.
 */
export const childContextsOf = (ctx: ComponentContextPartial) => {
    const found = new Set<ComponentContextPartial>();

    collectChildren(ctx, found);

    // Every collected context is live, so each has a root anchor.
    return Array.from(found).sort((first, second) =>
        getContextRootAnchor(first)!.compareDocumentPosition(
            getContextRootAnchor(second)!
        ) & 4
            ? -1
            : 1
    );
};

const rendersNode = (ctx: ComponentContextPartial, node: Node) =>
    rootNodesOf(ctx).some((root) => root === node || root.contains(node));

/**
 * Resolves the innermost live component instance whose rendered output
 * contains `node`.
 * @param node Any DOM node.
 * @returns The owning component context, or `undefined` outside every app.
 */
export const findOwnerContext = (node: Node) => {
    let owner: ComponentContextPartial | undefined;
    let candidates = getAppRoots();
    let match = candidates.find((ctx) => rendersNode(ctx, node));

    while (match) {
        kindOf(match) === 'component' && (owner = match);
        candidates = childContextsOf(match);
        match = candidates.find((ctx) => rendersNode(ctx, node));
    }

    return owner;
};

/**
 * The activities a tree node uses directly: an effect boundary's own
 * activity, or a component's child effect boundaries and attribute bindings.
 * @param ctx The component or boundary context.
 * @returns The activities, without duplicates.
 */
export const activitiesOf = (ctx: ComponentContextPartial) => {
    const found = new Set<InspectableActivity>();
    const addBinding = (value: unknown) => {
        isAttrBinding(value) && value.activity && found.add(value.activity);
    };

    if (ctx.activity) {
        return [ctx.activity];
    }

    childContextsOf(ctx).forEach(
        (child) => child.activity && found.add(child.activity)
    );
    ctx.slots?.forEach(({ value }) => {
        addBinding(value);
        value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            Object.values(value).forEach(addBinding);
    });

    return Array.from(found);
};
