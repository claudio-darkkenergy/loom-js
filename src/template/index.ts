import { config } from '../config';
import {
    ActivityContext,
    TemplateNodeUpdate,
    TemplateStoreValue,
    TemplateTagChunks,
    TemplateTagValue,
    TemplateUpdateStoreValue
} from '../index.d';
import { getUpdate } from './get-update';
import { setDynamicNodes } from './set-dynamic-nodes';

const { TOKEN } = config;
const templateStore = new Map<TemplateTagChunks, TemplateStoreValue>();
const templateUpdateStore = new WeakMap<
    ChildNode[],
    TemplateUpdateStoreValue
>();

export function Template(
    this: ActivityContext,
    chunks: TemplateTagChunks,
    ...interpolations: TemplateTagValue[]
) {
    // The ActivityContext is used to lookup the appropriate template updates,
    // which is mapped to the current render activity.
    const ctx = this;
    let fragment: null | DocumentFragment = null;

    if (!templateStore.has(chunks)) {
        /* Template initialization */
        initTemplate();
    }

    if (
        !templateUpdateStore.has(ctx.liveNodes || []) ||
        templateUpdateStore.get(ctx.liveNodes || [])?.chunks !== chunks
    ) {
        // Store the updates with the chunks.
        initUpdates();
    }

    // Weakly map the node updates to the soon to be live nodes.

    // DOM updates
    doUpdates();

    return fragment ?? document.createDocumentFragment();

    function initTemplate() {
        const dynamicNodes = new Map<Node, number[]>();
        const range = window.document.createRange();
        const fragmentTemplate = range.createContextualFragment(
            chunks.join(TOKEN)
        );
        const treeWalker = document.createTreeWalker(
            fragmentTemplate,
            NodeFilter.SHOW_ALL
        );

        // Set only the dynamic nodes.
        setDynamicNodes(dynamicNodes, treeWalker);

        templateStore.set(chunks, {
            fragmentTemplate,
            dynamicNodes
        });
    }

    function initUpdates() {
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

            return getUpdate(node as ChildNode);
        });

        ctx.liveNodes = Array.from(fragment.childNodes);

        templateUpdateStore.set(ctx.liveNodes, {
            chunks,
            updates
        });
    }

    function doUpdates() {
        templateUpdateStore
            .get(ctx.liveNodes || [])
            ?.updates.forEach((update) => update(interpolations));
    }
}
