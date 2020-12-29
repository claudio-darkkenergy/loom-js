import { config } from '../config';
import {
    ActivityContext,
    GlobalWindow,
    TemplateNodeUpdate,
    TemplateStoreValue,
    TemplateTagChunks,
    TemplateTagValue,
    TemplateUpdateStoreValue
} from '../types';
import { getUpdate } from './get-update';
import { setDynamicNodes } from './set-dynamic-nodes';

const templateStore = new Map<TemplateTagChunks, TemplateStoreValue>();
const templateUpdateStore = new WeakMap<ChildNode, TemplateUpdateStoreValue>();
console.log('templateStore', templateStore);
console.log('templateUpdateStore', templateUpdateStore);

export function Template(
    this: ActivityContext,
    chunks: TemplateTagChunks,
    ...interpolations: TemplateTagValue[]
) {
    // The ActivityContext is used to lookup the appropriate template updates,
    // which is mapped to the current render activity.
    const ctx = this;
    let fragment: null | DocumentFragment = null;
    console.group('Template', interpolations, ctx);

    if (!config.global) {
        throw Error(
            `Window must be set on the global config, but got ${config.global}`
        );
    }

    const window: GlobalWindow = config.global;

    if (!templateStore.has(chunks)) {
        // Template initialization
        initTemplate();
    }

    if (
        !ctx.node ||
        !templateUpdateStore.has(ctx.node) ||
        templateUpdateStore.get(ctx.node)?.chunks !== chunks
    ) {
        // The node is new, or active node w/ new chunks.
        // Store the updates with the chunks.
        initUpdates();
    }

    // DOM updates
    doUpdates();
    console.groupEnd();

    return fragment ?? window.document.createDocumentFragment();

    function initTemplate() {
        console.info('Initializing template...');
        const dynamicNodes = new Map<Node, number[]>();
        const range = window.document.createRange();
        const fragmentTemplate = range.createContextualFragment(
            chunks.join(config.TOKEN)
        );
        const treeWalker = window.document.createTreeWalker(
            fragmentTemplate,
            window.NodeFilter.SHOW_ALL
        );

        // Set only the dynamic nodes.
        setDynamicNodes(dynamicNodes, treeWalker);

        templateStore.set(chunks, {
            fragmentTemplate,
            dynamicNodes
        });
    }

    function initUpdates() {
        console.info('Initializing updates...');
        const { fragmentTemplate, dynamicNodes } =
            templateStore.get(chunks) || {};
        fragment = fragmentTemplate?.cloneNode(true) as DocumentFragment;
        // Get all the updates to cache.
        const updates: TemplateNodeUpdate[] = Array.from(
            dynamicNodes || []
        ).map(([, path]) => {
            const node = path.reduce(
                (node, i) => node.childNodes[i],
                fragment as Node
            );

            return getUpdate(node as ChildNode);
        });

        // Set the root node for the template.
        ctx.node = fragment.children[0];

        // There must be a single root node for the template.
        if (!ctx.node) {
            console.error('Instead of Node, recieved', fragment.childNodes);
            throw Error('[Template Error] Must contain one root node.');
        }

        // Weakly map the node updates & chunks to the soon to be live node.
        templateUpdateStore.set(ctx.node, {
            chunks,
            updates
        });
    }

    function doUpdates() {
        console.info('Updating...');
        if (ctx.node) {
            templateUpdateStore
                .get(ctx.node)
                ?.updates.forEach((update) => update(interpolations));
        }
    }
}
