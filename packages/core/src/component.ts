import { htmlParser } from './html-parser';
import {
    isLiveContext,
    lifeCycleHooks,
    memoizedOwnedValues,
    memoizedRefContext,
    resetLifeCycles
} from './lib/context';
import type {
    ComponentContextPartial,
    ComponentFactory,
    ComponentInputProps,
    RefContext,
    TemplateFunction
} from './types';

// Stands in for an instance that has created no refs yet.
const noRefs: ReadonlySet<RefContext> = new Set();

// The props each live context last rendered with, as the caller passed them
// (`children` unflattened), so a re-invocation can compare by reference.
const lastRenderedProps = new WeakMap<ComponentContextPartial, object>();

// Shallow-equal over own keys, `ref` excluded: a `ref` is consumed by the
// render that receives it, so it is not part of what the output depends on.
const haveEqualProps = (previous: object, next: object) => {
    const previousKeys = Object.keys(previous).filter((key) => key !== 'ref');
    const nextKeys = Object.keys(next).filter((key) => key !== 'ref');

    return (
        previousKeys.length === nextKeys.length &&
        nextKeys.every(
            (key) =>
                key in previous &&
                Object.is(
                    (previous as Record<string, unknown>)[key],
                    (next as Record<string, unknown>)[key]
                )
        )
    );
};

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
            const isFresh = !liveCtx.root || scopedCtx === undefined;
            const previousProps = lastRenderedProps.get(ctx);

            // Same props on a live instance: nothing to re-render. A remount
            // or an incoming `ref` still renders.
            if (
                !dryRun &&
                !isFresh &&
                !props.ref &&
                previousProps &&
                ctx.fingerPrint === templateFunction &&
                isLiveContext(ctx) &&
                haveEqualProps(previousProps, props)
            ) {
                return ctx;
            }

            // Ensures the template context is fresh during 1st render &
            // whenever the fingerprint doesn't match the render function.
            if (isFresh) {
                const ref = props.ref;

                // Collections are created on first use.
                delete ctx.children;
                delete ctx.refs;
                ctx.fragment = false;
                ctx.fingerPrint = templateFunction;
                resetLifeCycles(ctx);
                ctx.node = () => ctx.root!;
                // ctx.render = htmlParser.bind(ctx);
                ctx.render = htmlParser.bind(ctx);
                // A refreshed context must not replay another template's
                // owned values.
                delete ctx.owned;

                if (ref) {
                    // Set component's received `RefContext` prop onto the the current component's `ComponentContext`.
                    // This creates a connection between part of this context & a component ascendant that needs
                    // a reference to it.
                    ctx.ref = ref;
                    ctx.ref.node = ctx.node;
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

            refIterator = (ctx.refs ?? noRefs).values();

            const ownedValues = memoizedOwnedValues(ctx);

            // Life-cycle setters append only while this render runs; the
            // set closes with the render so later registrations are no-ops.
            delete ctx.registering;

            /*
             * ```
             * component(
             *    // This is the render (template) function that gets called now.
             *    (html, {}) => html`<h1>Hello World!</h1>`
             * );
             * ```
             */
            const template = templateFunction(ctx.render!, {
                ...inputProps,
                ...lifeCycleHooks(ctx),
                createRef: memoizedRefContext(ctx, refIterator),
                ctxRefs: () => (ctx.refs ?? noRefs).values(),
                node: ctx.node!,
                own: ownedValues.own
            });

            ownedValues.settle();
            delete ctx.registering;
            lastRenderedProps.set(ctx, props);

            return template;
        }

        // Detection goes by this marker (see `contextFunctionKind`) — a
        // minifier may rename the function.
        contextFunction.contextFunctionKind = 'component' as const;
        contextFunction.key = props.key;

        return contextFunction;
    };

    return componentFunction;
};
