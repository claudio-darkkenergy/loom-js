import { canDebug, config } from './config';
import { _lifeCycles, getShareableContext } from './lib/context';
import { getDocument, getWindow } from './lib/dom';
import {
    createDiagnosticSubject,
    formatDiagnostic
} from './lib/globals/diagnostic-format';
import { loomConsole } from './lib/globals/loom-console';
import { deepDiffObject, isObject } from './lib/helpers';
import { isWithinHydratingRoot } from './lib/hydrating-roots';
import { reactive } from './lib/reactive';
import { getPaths, setUpdatesForPaths } from './lib/templating';
// Imported by path — not via the templating barrel — to avoid a barrel cycle
// (`compile-component-tags` imports `component`, which imports this module).
import { compileComponentTags } from './lib/templating/compile-component-tags';
import { scanTableScope } from './lib/templating/table-scope';
import type {
    ComponentContext,
    ComponentContextPartial,
    PlainObject,
    TemplateRoot, // TemplateNodeUpdate,
    TemplateRootArray,
    TemplateTagValue,
    TemplateTransformPlan
} from './types';

// Component Template Cache Store
// Keyed by chunks identity — the call site's `TemplateStringsArray`, or a
// transform-synthesized chunks array (both are one stable identity for the
// life of the process). A synthesized children template's derived sub-chunks
// live on its parent's cached plan, never in a separate keyed store.
//
// The compile plan is pure string work and shared across documents; the
// parsed fragment and its `paths` (which hold `Attr` references into that
// fragment) live per document — templates parse against each document that
// renders them, so any number of injected windows (of any DOM
// implementation) can render in one process, and a server window's
// fragments release with its document (`WeakMap`). In the browser there is
// one document ever, so this stays a single cached parse.
interface TemplateDocumentCacheEntry {
    fragment: DocumentFragment;
    paths: Set<[number[], Attr | undefined]>;
}

const templateCacheStore = new Map<
    TemplateStringsArray | string[],
    {
        documentCache: WeakMap<Document, TemplateDocumentCacheEntry>;
        plan: TemplateTransformPlan | null;
    }
>();
// Component Instance Context Store
const instanceContextStore = new WeakSet<ComponentContextPartial>();

export function htmlParser(
    this: ComponentContextPartial,
    chunks: TemplateStringsArray,
    ...interpolations: TemplateTagValue[]
) {
    const ctx = this as ComponentContext;
    let cacheEntry = templateCacheStore.get(chunks);

    // This only runs once per component "definition" (`TaggedTemplate`.)
    if (!cacheEntry) {
        // Compile any component-element syntax out of the chunks before the
        // native parser sees them. A `null` plan means no component tags —
        // the template passes through byte-identical.
        cacheEntry = {
            documentCache: new WeakMap(),
            plan: compileComponentTags(chunks)
        };
        templateCacheStore.set(chunks, cacheEntry);
    }

    const { documentCache, plan } = cacheEntry;
    const currentDocument = getDocument();
    let documentEntry = documentCache.get(currentDocument);

    // This runs once per (definition, document) — each document parses the
    // template against its own realm.
    if (!documentEntry) {
        const statics = plan ? plan.chunks : (chunks as readonly string[]);
        const tableScope = scanTableScope(statics);
        let fragment: DocumentFragment;

        if (tableScope.hasTableMarkup) {
            // Template-element parsing preserves table-part roots, and
            // table-content tokens become comment markers (safe from foster
            // parenting) that `setUpdatesForPaths` swaps back at wire time.
            const templateElement = currentDocument.createElement(
                'template'
            ) as HTMLTemplateElement;

            templateElement.innerHTML = statics
                .map((chunk, chunkIndex) =>
                    chunkIndex < statics.length - 1
                        ? chunk +
                          (tableScope.tableContentTokens.has(chunkIndex)
                              ? `<!--${config.TOKEN}-->`
                              : config.TOKEN)
                        : chunk
                )
                .join('');
            fragment = templateElement.content;
        } else {
            // Creates a `DocumentFragment` using the component HTML template as its context (children.)
            fragment = currentDocument
                .createRange()
                .createContextualFragment(statics.join(config.TOKEN));
        }

        // Check for a "rootless" component template.
        // This will inherit its connected parent element as its root.
        if (/^<>/.test(statics[0]?.trim() ?? '') && fragment.childNodes[0]) {
            // Remove the fragment artifact "<>" from the renderable content.
            // Always assign a string — a nullish assignment leaves the
            // coercion up to the host DOM implementation.
            fragment.childNodes[0].textContent =
                fragment.childNodes[0].textContent?.replace('<>', '') ?? '';
        }

        // Will be "walked" to obtain the dynamic paths mappings.
        const treeWalker = currentDocument.createTreeWalker(
            fragment,
            getWindow().NodeFilter.SHOW_ALL
        );

        // Cache this document's parse of the template.
        documentEntry = { fragment, paths: getPaths(treeWalker) };
        documentCache.set(currentDocument, documentEntry);
    }

    // Apply the cached plan to this render's raw interpolations — the plan is
    // static, the derived values are not. Without a plan, both pass through.
    const values = plan
        ? plan.getters.map((get) => get(interpolations))
        : interpolations;
    const isTemplateFragment = /^<>/.test(
        (plan ? plan.chunks[0] : chunks[0])?.trim() ?? ''
    );

    const instanceAnchor =
        (Array.isArray(ctx.root) ? ctx.root[0]?.parentElement : ctx.root) ??
        null;

    // Runs only once per component "instance", while its root node or node-list is "alive".
    // "Alive" = attached to the document, or inside a pending hydrate
    // render's deliberately detached tree.
    if (
        ctx.chunks !== chunks ||
        !instanceContextStore.has(ctx) ||
        !(
            getDocument().contains(instanceAnchor) ||
            isWithinHydratingRoot(instanceAnchor)
        )
    ) {
        const { fragment, paths } = documentEntry;
        // The live fragment - the `DocumentFragment`
        // which will contain all the live nodes which will exist in the DOM.
        // The cached fragment is per document (see `templateCacheStore`), so
        // this clone never crosses documents; `importNode` stays as the
        // spec-neutral spelling of "clone into this document".
        const liveFragment = currentDocument.importNode(fragment, true);
        // Convert `values[]` to object.
        const valueObj = values.reduce(
            (acc: { [key: number]: TemplateTagValue }, value, i) => {
                acc[i] = value;
                return acc;
            },
            {}
        );

        ctx.chunks = chunks;
        // Create the interpolations' reactive `Proxy`.
        ctx.values = reactive(valueObj, (oldValue, newValue) => {
            const isContextFunction = (value: TemplateTagValue) =>
                typeof value === 'function' &&
                value.name.toLowerCase().endsWith('contextfunction');

            switch (true) {
                // Handle DOM Nodes.
                case oldValue instanceof getWindow().Node &&
                    newValue instanceof getWindow().Node:
                    return !(oldValue as Node).isSameNode(newValue as Node);
                // Handle `ContextFunction`s.
                case isContextFunction(oldValue) && isContextFunction(newValue):
                    return true;
                // Handle object literals.
                case isObject(oldValue) && isObject(newValue):
                    return deepDiffObject(
                        oldValue as PlainObject,
                        newValue as PlainObject
                    );
                // Handle primitives & everything else using strict comparison.
                default:
                    return oldValue !== newValue;
            }
        });

        // Update the context root with the latest nodes.
        if (isTemplateFragment) {
            ctx.fragment = true;
            ctx.root = Array.from(liveFragment.childNodes) as TemplateRootArray;
        } else {
            ctx.root = liveFragment.children[0] as TemplateRoot;
        }

        // Creation hook
        _lifeCycles.creation(ctx);
        // Pre-render hook
        _lifeCycles.preRender(ctx);
        // Set all the updaters for each dynamic node path & calls them.
        setUpdatesForPaths(paths, ctx, liveFragment);

        if (isTemplateFragment) {
            // Re-capture the root node-list: wiring a top-level dynamic slot
            // replaces the placeholder text nodes captured above, which would
            // leave `ctx.root` referencing detached nodes.
            ctx.root = Array.from(liveFragment.childNodes) as TemplateRootArray;
        }

        // setParentOnContext(ctx);
        instanceContextStore.add(ctx);
    } else {
        const canDebugUpdates = canDebug('updates');

        // Pre-render hook
        _lifeCycles.preRender(ctx);
        canDebugUpdates &&
            loomConsole.groupCollapsed(
                ...formatDiagnostic({
                    event: 'updating',
                    scope: 'updates',
                    subject: ctx.key
                        ? createDiagnosticSubject('component', String(ctx.key))
                        : undefined
                }),
                getShareableContext(ctx)
            );

        // Set the derived interpolations as new values of the `props` proxy object.
        values.forEach((value, i) => {
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
