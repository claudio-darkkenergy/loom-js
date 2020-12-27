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
const templateUpdateStore = new WeakMap<
    ActivityContext,
    TemplateUpdateStoreValue
>();
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
        /* Template initialization */
        initTemplate();
    }

    if (
        !templateUpdateStore.has(ctx) ||
        templateUpdateStore.get(ctx)?.chunks !== chunks
    ) {
        // Store the updates with the chunks.
        debugger;
        initUpdates();
    }

    // Weakly map the node updates to the soon to be live nodes.

    // DOM updates
    doUpdates();
    console.groupEnd();

    return fragment ?? window.document.createDocumentFragment();

    function initTemplate() {
        console.log('initializing template...');
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
        console.log('initializing updates...');
        const { fragmentTemplate, dynamicNodes } =
            templateStore.get(chunks) || {};
        fragment = fragmentTemplate?.cloneNode(true) as DocumentFragment;

        const updates: TemplateNodeUpdate[] = Array.from(
            dynamicNodes || []
        ).map(([, path]) => {
            const node = path.reduce(
                (node, i) => node.childNodes[i],
                fragment as Node
            );

            const update = getUpdate(node as ChildNode);
            // console.
            return update;
        });

        ctx.liveNodes = Array.from(fragment.childNodes);

        templateUpdateStore.set(ctx, {
            chunks,
            updates
        });
    }

    function doUpdates() {
        console.log('updating', ctx);
        templateUpdateStore
            .get(ctx)
            ?.updates.forEach((update) => update(interpolations));
    }
}
