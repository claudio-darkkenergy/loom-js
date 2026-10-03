import type { ComponentContextPartial, RefContext } from '../../types';

/** Stands in for an instance that has created no refs yet. */
export const noRefs: ReadonlySet<RefContext> = new Set();

/**
 * Creates a `RefContext` & ensures the ref context is never lost (memoized.)
 * This allows a component to create many ref contexts w/o losing them on re-renders.
 * The render's refs replay in creation order from the first `createRef` call;
 * once the cached ones run out, new ones are created & cached for future renders.
 * @param ctx The cached/scoped template context
 * @returns RefContext
 */
export const memoizedRefContext = (ctx: ComponentContextPartial) => {
    // Traverses the refs cached before this render. Opened by the first
    // call, before the render adds any, so it never replays a new one.
    let cachedRefs: IterableIterator<RefContext> | undefined;

    // This is the `createRef` prop which is provided to each component & returns the `RefContext`.
    return () => {
        cachedRefs ??= (ctx.refs ?? noRefs).values();

        let ref: RefContext | undefined = cachedRefs.next().value;

        if (ref) {
            return ref;
        }

        ref = refContext();
        (ctx.refs ??= new Set()).add(ref);

        return ref;
    };
};

/**
 * Creates a reference which can be hooked into by the nested component which receives
 * this as the prop, `ref`. Use this reference to hook into the component-of-context's life-cycle
 * & gain access to its root node.
 * Handler props are added once the hook is called so that it can be referenced for later execution.
 * @returns Access to the nested component which receives this reference.
 */
const refContext = (): RefContext => ({
    onBeforeRender(handler) {
        this.beforeRender = handler;
    },
    onCreated(handler) {
        this.created = handler;
    },
    onMounted(handler) {
        this.mounted = handler;
    },
    onRendered(handler) {
        this.rendered = handler;
    },
    onUnmounted(handler) {
        this.unmounted = handler;
    }
});
