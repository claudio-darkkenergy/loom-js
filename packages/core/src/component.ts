import { htmlParser } from './html-parser';
import { lifeCycles, memoizedRefContext } from './lib/context';
import type {
    ComponentContextPartial,
    ComponentFactory,
    ComponentInputProps,
    RefContext,
    TemplateFunction
} from './types';

export const component: ComponentFactory = <Props extends object = {}>(
    templateFunction: TemplateFunction<Props>
) => {
    const componentFunction = (
        // The empty-object default only applies to propless calls, which the
        // public `Component` signature permits only when `Props` has no
        // required members — so `{}` is a valid `ComponentInputProps<Props>`
        // in every legal call.
        props: ComponentInputProps<Props> = {} as ComponentInputProps<Props>
    ) => {
        /**
         * The component context function is responsible for configuring each component & its
         * context.
         * @param liveCtx - The live context that gets passed down to the component context.
         * @param dryRun - Indicates whether the component context should be returned as a snapshot
         * without invoking the component template. This is useful for previewing the component
         * context before rendering it, which also means that the returned context will get thrown
         * away, as it's only a snapshot.
         * @returns The component context (or snapshot) for each component.
         */
        function contextFunction(
            liveCtx: ComponentContextPartial = {},
            dryRun = false
        ) {
            const scopedCtx = liveCtx.ctxScopes
                ? liveCtx.ctxScopes.get(templateFunction)
                : null;
            const ctx = scopedCtx || (!liveCtx.ctxScopes ? liveCtx : {});
            // Holds any possible child `RefContext`s.
            let refIterator: IterableIterator<RefContext>;

            // Ensures the template context is fresh during 1st render &
            // whenever the fingerprint doesn't match the render function.
            if (!liveCtx.root || scopedCtx === undefined) {
                const ref = props.ref;

                ctx.children = new Map();
                ctx.fragment = false;
                ctx.fingerPrint = templateFunction;
                ctx.lifeCycles = lifeCycles(ctx);
                ctx.node = () => ctx.root!;
                ctx.refs = new Set<RefContext>();
                // ctx.render = htmlParser.bind(ctx);
                ctx.render = htmlParser.bind(ctx);

                if (ref) {
                    // Set component's received `RefContext` prop onto the the current component's `ComponentContext`.
                    // This creates a connection between part of this context & a component ascendant that needs
                    // a reference to it.
                    ctx.ref = ref;
                    ctx.ref.node = ctx.node;
                    ctx.beforeRender = ctx.ref.beforeRender;
                    ctx.created = ctx.ref.created;
                    ctx.mounted = ctx.ref.mounted;
                    ctx.rendered = ctx.ref.rendered;
                    ctx.unmounted = ctx.ref.unmounted;
                    !dryRun && delete props.ref;
                }

                if (liveCtx.ctxScopes) {
                    ctx.parent = liveCtx;
                    liveCtx.ctxScopes.set(templateFunction, ctx);
                }
            }

            ctx.key = props.key;
            // One object serves both the cached context and the template call
            // below — the context store is `Props`-agnostic, so reading
            // `ctx.props` back would erase the `Props` members' types.
            const inputProps: ComponentInputProps<Props> = {
                ...props,
                children: Array.isArray(props.children)
                    ? props.children.flat()
                    : props.children
            };

            ctx.props = inputProps;

            if (dryRun) {
                return ctx;
            }

            refIterator = ctx.refs!.values();

            /*
             * ```
             * component(
             *    // This is the render (template) function that gets called now.
             *    (html, {}) => html`<h1>Hello World!</h1>`
             * );
             * ```
             */
            return templateFunction(ctx.render!, {
                ...inputProps,
                ...ctx.lifeCycles!,
                createRef: memoizedRefContext(ctx, refIterator),
                ctxRefs: () => ctx.refs!.values(),
                node: ctx.node!
            });
        }

        return contextFunction;
    };

    return componentFunction;
};
