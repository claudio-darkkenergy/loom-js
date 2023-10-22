import { htmlParser } from './html-parser';
import { lifeCycles, memoizedRefContext } from './lib/context';
import type {
    Component,
    ComponentArgs,
    ComponentContextPartial,
    ComponentFactory,
    ComponentProps,
    ContextNodeGetter,
    LifeCycleHookProps,
    RefContext,
    TaggedTemplate,
    TemplateFunction,
    TemplateRoot,
    TemplateRootArray
} from './types';

export const component: ComponentFactory = <Props extends object = {}>(
    templateFunction: TemplateFunction<Props>
) => {
    const componentFunction: Component = (props = {}) => {
        // This is where we can add to the context to configure each component.
        function contextFunction(liveCtx: ComponentContextPartial = {}) {
            const scopedCtx =
                liveCtx.ctxScopes &&
                liveCtx.ctxScopes.get(templateFunction as TemplateFunction);
            const ctx = scopedCtx || (!liveCtx.ctxScopes ? liveCtx : {});
            // Holds any possible child `RefContext`s.
            let refIterator: IterableIterator<RefContext>;

            // Ensures the template context is fresh during 1st render &
            // whenever the fingerprint doesn't match the render function.
            if (!liveCtx.root) {
                const ref = props.ref;

                ctx.children = [];
                ctx.fragment = false;
                ctx.fingerPrint = templateFunction as TemplateFunction;
                ctx.lifeCycles = lifeCycles(ctx);
                ctx.node = () => ctx.root as TemplateRoot | TemplateRootArray;
                ctx.refs = new Set<RefContext>();
                ctx.render = htmlParser.bind(ctx);

                if (ref) {
                    // Set component's received `RefContext` prop onto the the current component `ComponentContext`.
                    // This creates a connection between part of this context & a component ascendant that needs
                    // a reference to it.
                    ctx.ref = ref;
                    ctx.ref.node = ctx.node;
                    ctx.beforeRender = ctx.ref.beforeRender;
                    ctx.created = ctx.ref.created;
                    ctx.mounted = ctx.ref.mounted;
                    ctx.rendered = ctx.ref.rendered;
                    ctx.unmounted = ctx.ref.unmounted;
                    delete props.ref;
                }

                if (liveCtx.ctxScopes) {
                    ctx.parent = liveCtx;
                    liveCtx.ctxScopes.set(
                        templateFunction as TemplateFunction,
                        ctx
                    );
                }
            }

            ctx.key = props.key;
            ctx.props = props;
            refIterator = (ctx.refs as Set<RefContext>).values();

            /*
             * ```
             * component(
             *    // This is the render function that gets called now.
             *    (html, {}) => html`<h1>Hello World!</h1>`
             * );
             * ```
             */
            return templateFunction(
                ctx.render as TaggedTemplate,
                {
                    ...(ctx.props as ComponentProps<Props>),
                    ...(ctx.lifeCycles as LifeCycleHookProps),
                    createRef: memoizedRefContext(ctx, refIterator),
                    ctxRefs: () => (ctx.refs as Set<RefContext>).values(),
                    node: ctx.node as ContextNodeGetter
                } as ComponentArgs<Props>
            );
        }

        return contextFunction;
    };

    return componentFunction;
};
