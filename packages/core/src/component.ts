import { htmlParser } from './html-parser';
import {
    isLiveContext,
    lifeCycleHooks,
    memoizedOwnedValues,
    memoizedRefContext,
    noRefs,
    resetLifeCycles
} from './lib/context';
import type {
    ComponentContextPartial,
    ComponentFactory,
    ComponentInputProps,
    TemplateFunction
} from './types';

// The props each live context last rendered with, as the caller passed them
// (`children` unflattened), so a re-invocation can compare by reference.
const lastRenderedProps = new WeakMap<
    ComponentContextPartial,
    Record<string, unknown>
>();

// Shallow-equal over own keys, `ref` excluded: a `ref` is consumed by the
// render that receives it, so it is not part of what the output depends on.
// Compared in place — this runs for every item of every keyed pass.
const haveEqualProps = (
    previous: Record<string, unknown>,
    next: Record<string, unknown>
) => {
    let unmatched = 0;

    for (const key in next) {
        if (key === 'ref' || !Object.hasOwn(next, key)) {
            continue;
        }

        if (!(key in previous) || !Object.is(previous[key], next[key])) {
            return false;
        }

        unmatched += 1;
    }

    for (const key in previous) {
        key !== 'ref' && Object.hasOwn(previous, key) && (unmatched -= 1);
    }

    return unmatched === 0;
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

                // Collections are created on first use; a refreshed context
                // drops the ones it holds.
                ctx.arrayChildren &&= undefined;
                ctx.children &&= undefined;
                ctx.refs &&= undefined;
                ctx.fragment = false;
                ctx.fingerPrint = templateFunction;
                resetLifeCycles(ctx);
                ctx.node = () => ctx.root!;
                // ctx.render = htmlParser.bind(ctx);
                ctx.render = htmlParser.bind(ctx);
                // A refreshed context must not replay another template's
                // owned values.
                ctx.owned &&= undefined;

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

            const ownedValues = memoizedOwnedValues(ctx);

            // Life-cycle setters append only while this render runs; the
            // set closes with the render so later registrations are no-ops.
            ctx.registering &&= undefined;

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
                createRef: memoizedRefContext(ctx),
                ctxRefs: () => (ctx.refs ?? noRefs).values(),
                node: ctx.node!,
                own: ownedValues.own
            });

            ownedValues.settle();
            ctx.registering &&= undefined;
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
