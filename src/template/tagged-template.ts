import { config } from '../config';
import { lifeCycles } from '../life-cycles';
import {
    TemplateContext,
    TemplateNodeUpdate,
    TemplateRoot,
    TemplateTagValue
} from '../types';
import { getLiveUpdates } from './get-live-updates';
import { getPaths } from './get-paths';

// Component template cache
const templateStore = new Map<
    TemplateStringsArray,
    { fragment: DocumentFragment; paths: Map<number[], Attr[] | undefined> }
>();
// Cached updaters - called on renders for a given component "instance".
const updateStore = new WeakMap<
    TemplateRoot,
    {
        chunks: TemplateStringsArray;
        updates: TemplateNodeUpdate[];
    }
>();

export function taggedTemplate(
    this: TemplateContext,
    chunks: TemplateStringsArray,
    ...interpolations: TemplateTagValue[]
) {
    const ctx = this;

    // This only runs once per component "definition" (`TaggedTemplate`.)
    if (!templateStore.has(chunks)) {
        // Creates a `DocumentFragment` using the component HTML template as its context (children.)
        const fragment = document
            .createRange()
            .createContextualFragment(chunks.join(config.TOKEN));

        // Check for a "rootless" component template.
        // This will inherit its connected parent element as its root.
        if (/^<template/.test(chunks[0].trim())) {
            // Replace the template node w/ a deep copy of its contents.
            fragment.children[0].replaceWith(
                (fragment.children[0] as HTMLTemplateElement).content.cloneNode(
                    true
                )
            );
        }

        // Will be "walked" to obtain the dynamic paths mappings.
        const treeWalker = document.createTreeWalker(
            fragment,
            window.NodeFilter.SHOW_ALL
        );

        // Cache the chunks, fragment, & dynamic paths.
        templateStore.set(chunks, {
            fragment,
            // Results in the dynamic paths mappings - used for making updates.
            paths: getPaths(treeWalker)
        });
    }

    // Runs only once per component "instance", while its root node or node-list is "alive".
    if (
        !updateStore.has(ctx.root) ||
        !document.contains(
            ctx.root instanceof NodeList ? ctx.root[0].parentElement : ctx.root
        )
    ) {
        const { fragment, paths } = templateStore.get(chunks) || {};
        // The live fragment - the `DocumentFragment`
        // which will contain all the live nodes which will exist in the DOM.
        const liveFragment = fragment
            ? (fragment.cloneNode(true) as DocumentFragment)
            : document.createDocumentFragment();
        // Get all the updaters for each dynamic node path.
        const updates = getLiveUpdates(liveFragment, paths || new Map());
        const rootNode = liveFragment.children[0];

        ctx.root = !rootNode ? liveFragment.childNodes : rootNode;

        if (!ctx.root) {
            // Must have at least one root node.
            console.warn(
                `Template must contain at least one root node - received \`${JSON.stringify(
                    ctx.root
                )}\`.`
            );
        } else {
            // Cache the updates & chunks for the root node or node-list.
            updateStore.set(ctx.root, {
                chunks,
                updates
            });
        }

        // Creation hook
        lifeCycles.creation(ctx);
    }

    // Before-render hook
    lifeCycles.preRender(ctx);

    // Call all the updates for the component for every render cycle.
    updateStore
        .get(ctx.root as Node)
        ?.updates.forEach((update) => update(interpolations));

    // After-render hook
    lifeCycles.postRender(ctx);

    return ctx.root;
}
