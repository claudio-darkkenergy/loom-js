import { config } from '../config';
import { lifeCycles } from '../life-cycles';
import {
    TemplateContext,
    TemplateNodeUpdate,
    TemplateTagValue
} from '../types';
import { getLiveUpdates } from './get-live-updates';
import { setPaths } from './set-paths';

// Component template cache
const templateStore = new Map<
    TemplateStringsArray,
    { fragment: DocumentFragment; paths: Map<number[], Attr[] | undefined> }
>();
// Cached updaters - called on renders for a given component "instance".
const updateStore = new WeakMap<
    Node,
    {
        chunks: TemplateStringsArray;
        updates: TemplateNodeUpdate[];
    }
>();
console.log('template store', templateStore);
console.log('update store', updateStore);

export function taggedTemplate(
    this: TemplateContext,
    chunks: TemplateStringsArray,
    ...interpolations: TemplateTagValue[]
): Node {
    const ctx = this;
    let rootNode: Node;

    // This only runs once per component "definition" (`TaggedTemplate`.)
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

    // Runs only once per component "instance", while its root node is "alive".
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

    // Call all the updates for the component for every render cycle.
    updateStore
        .get(ctx.root as Node)
        ?.updates.forEach((update) => update(interpolations));

    rootNode = ctx.root || document.createDocumentFragment();

    // Handle life-cycles for the node.
    lifeCycles.init(ctx);

    return rootNode;
}
