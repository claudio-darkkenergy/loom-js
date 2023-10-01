import { canDebug, config } from './config';
import { _lifeCycles, getShareableContext } from './lib/context';
import { loomConsole } from './lib/globals/loom-console';
import { reactive } from './lib/reactive';
import { getPaths, setUpdatesForPaths } from './lib/templating';
import type {
    ComponentContext,
    ComponentContextPartial,
    TemplateRoot, // TemplateNodeUpdate,
    TemplateRootArray,
    TemplateTagValue
} from './types';

// Component Template Cache Store
const templateCacheStore = new Map<
    TemplateStringsArray,
    { fragment: DocumentFragment; paths: Set<[number[], Attr | undefined]> }
>();
// Component Instance Context Store
const instanceContextStore = new WeakSet<ComponentContextPartial>();

export function htmlParser(
    this: ComponentContextPartial,
    chunks: TemplateStringsArray,
    ...interpolations: TemplateTagValue[]
) {
    const ctx = this as ComponentContext;
    const canDebugUpdates = canDebug('updates');

    // This only runs once per component "definition" (`TaggedTemplate`.)
    if (!templateCacheStore.has(chunks)) {
        // Creates a `DocumentFragment` using the component HTML template as its context (children.)
        const fragment = document
            .createRange()
            .createContextualFragment(chunks.join(config.TOKEN));

        // Check for a "rootless" component template.
        // This will inherit its connected parent element as its root.
        if (/^<>/.test(chunks[0].trim())) {
            ctx.fragment = true;
            // Remove the fragment artifact "<>" from the renderable content.
            fragment.childNodes[0].textContent =
                fragment.childNodes[0].textContent?.replace('<>', '') || null;
        }

        // Will be "walked" to obtain the dynamic paths mappings.
        const treeWalker = document.createTreeWalker(
            fragment,
            window.NodeFilter.SHOW_ALL
        );

        // Cache the template using `ctx.fingerPrint`.
        templateCacheStore.set(chunks, {
            fragment,
            paths: getPaths(treeWalker)
        });
    }

    // Runs only once per component "instance", while its root node or node-list is "alive".
    if (
        ctx.chunks !== chunks ||
        !instanceContextStore.has(ctx) ||
        !document.contains(
            Array.isArray(ctx.root) ? ctx.root[0]?.parentElement : ctx.root
        )
    ) {
        const {
            fragment = document.createDocumentFragment(),
            paths = new Set<[number[], Attr | undefined]>()
        } = templateCacheStore.get(chunks) || {};
        // The live fragment - the `DocumentFragment`
        // which will contain all the live nodes which will exist in the DOM.
        const liveFragment = fragment.cloneNode(true) as DocumentFragment;
        // Convert `interpolations[]` to object.
        const valueObj = interpolations.reduce(
            (acc, value, i) => {
                acc[i] = value;
                return acc;
            },
            {} as { [key: number]: TemplateTagValue }
        );

        ctx.chunks = chunks;
        // Create the interpolations' reactive `Proxy`.
        ctx.values = reactive(valueObj, (oldValue, newValue) => {
            switch (true) {
                case oldValue instanceof Node && newValue instanceof Node:
                    return (oldValue as Node).isSameNode(newValue as Node);
                default:
                    return oldValue !== newValue;
            }
        });

        // Update the context root with the latest nodes.
        if (ctx.fragment) {
            ctx.root = Array.from(liveFragment.childNodes) as TemplateRootArray;
        } else {
            ctx.root = liveFragment.children[0] as TemplateRoot;
        }

        // Creation hook
        _lifeCycles.creation(ctx);
        canDebug('creation') &&
            loomConsole.info(
                `loom (Creation${ctx.key ? ' ' + ctx.key : ''})`,
                getShareableContext(ctx)
            );
        // Pre-render hook
        _lifeCycles.preRender(ctx);
        // Set all the updaters for each dynamic node path & calls them.
        canDebugUpdates &&
            loomConsole.groupCollapsed(
                `loom (Hydrating${ctx.key ? ' ' + ctx.key : ''}...)`,
                getShareableContext(ctx)
            );
        setUpdatesForPaths(paths, ctx, liveFragment);
        canDebugUpdates &&
            loomConsole.info('completed', getShareableContext(ctx));
        canDebugUpdates && loomConsole.groupEnd();
        // setParentOnContext(ctx);
        instanceContextStore.add(ctx);
    } else {
        // Pre-render hook
        _lifeCycles.preRender(ctx);
        canDebugUpdates &&
            loomConsole.groupCollapsed(
                `loom (Updating${ctx.key ? ' ' + ctx.key : ''}...)`,
                getShareableContext(ctx)
            );

        // Set interpolations as new values of the `props` proxy object.
        interpolations.forEach((value, i) => {
            canDebugUpdates &&
                loomConsole.info({
                    newValue: value,
                    oldValue: ctx.values[i]
                });
            ctx.values[i] = value;
        });

        canDebugUpdates &&
            loomConsole.info('completed', getShareableContext(ctx));
        canDebugUpdates && loomConsole.groupEnd();
    }

    // Pre-render hook
    _lifeCycles.postRender(ctx);

    return ctx;
}
