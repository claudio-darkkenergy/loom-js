// A pre-swap hydrate tree is detached from the document by design, which
// would fail `htmlParser`'s instance-freshness containment check and re-run
// the first-render path — observably double-firing creation-phase hooks
// (design D7's named fallback). This registry of in-flight hydrating roots
// widens that check to "attached, or inside a pending hydrate render" without
// weakening its genuine-staleness guard. Empty for every non-hydrating app —
// the membership check exits on `size === 0`.
import type { TemplateRoot, TemplateRootArray } from '../types';

const hydratingRoots = new Set<Node>();

const toNodeList = (root: TemplateRoot | TemplateRootArray | undefined) =>
    root === undefined ? [] : Array.isArray(root) ? root : [root];

export const addHydratingRoot = (
    root: TemplateRoot | TemplateRootArray | undefined
) => toNodeList(root).forEach((rootNode) => hydratingRoots.add(rootNode));

const idleWaiters: (() => void)[] = [];

export const removeHydratingRoot = (
    root: TemplateRoot | TemplateRootArray | undefined
) => {
    toNodeList(root).forEach((rootNode) => hydratingRoots.delete(rootNode));
    hydratingRoots.size === 0 &&
        idleWaiters.splice(0).forEach((notify) => notify());
};

/**
 * Runs `notify` once no hydrating boot is in flight — immediately when none
 * is, else right after the last pending hydration swap completes. Lets
 * boot-time work (the router's owed scroll) target the post-swap layout.
 */
export const whenHydrationIdle = (notify: () => void): void => {
    hydratingRoots.size === 0 ? notify() : idleWaiters.push(notify);
};

/**
 * `true` when `node` belongs to an in-flight hydrating render's detached
 * tree.
 */
export const isWithinHydratingRoot = (node: Node | null): boolean => {
    if (node === null || hydratingRoots.size === 0) {
        return false;
    }

    for (const hydratingRoot of hydratingRoots) {
        if (hydratingRoot === node || hydratingRoot.contains(node)) {
            return true;
        }
    }

    return false;
};
