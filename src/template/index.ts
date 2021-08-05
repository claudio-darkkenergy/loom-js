import { config } from '../config';
import {
    TemplateContext,
    TemplateNodeUpdate,
    TemplateTagValue
} from '../types';
import { getLiveUpdates } from './get-live-updates';
import { setPaths } from './set-paths';

const templateStore = new Map<
    TemplateStringsArray,
    { fragment: DocumentFragment; paths: Map<number[], Attr[] | undefined> }
>();
const updateStore = new WeakMap<
    Node,
    {
        chunks: TemplateStringsArray;
        updates: TemplateNodeUpdate[];
    }
>();

export function template(
    this: TemplateContext,
    chunks: TemplateStringsArray,
    ...interpolations: TemplateTagValue[]
): Node {
    let created = false;
    const ctx = this;
    let rootNode: Node;

    if (!templateStore.has(chunks)) {
        const fragment = document
            .createRange()
            .createContextualFragment(chunks.join(config.TOKEN));
        const treeWalker = document.createTreeWalker(
            fragment,
            window.NodeFilter.SHOW_ALL
        );

        templateStore.set(chunks, {
            fragment,
            paths: setPaths(treeWalker)
        });
    }

    if (
        !updateStore.has(ctx.root as Node) ||
        !document.contains(ctx.root as Node)
    ) {
        const { fragment, paths } = templateStore.get(chunks) || {};
        const liveFragment = fragment
            ? (fragment.cloneNode(true) as DocumentFragment)
            : document.createDocumentFragment();
        // Get all the updaters for each dynamic node path.
        const updates = getLiveUpdates(liveFragment, paths || new Map());

        ctx.root = liveFragment.children[0];

        if (!ctx.root) {
            console.warn(
                `Template must contain only one root node - received ${JSON.stringify(
                    liveFragment.children
                )}`,
                'Any additional node will get thrown out and not be rendered.'
            );
        } else {
            updateStore.set(ctx.root, {
                chunks,
                updates
            });
        }
    }

    updateStore
        .get(ctx.root as Node)
        ?.updates.forEach((update) => update(interpolations));

    rootNode = ctx.root || document.createDocumentFragment();

    // Creation life-cycle handler - only once.
    if (ctx.created && !created) {
        created = true;
        ctx.created(rootNode);
    }

    // Rendered life-cycle handler - every render.
    ctx.rendered && ctx.rendered(rootNode);
    return rootNode;
}
