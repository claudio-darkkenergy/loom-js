import type { ComponentContextPartial, RefContext } from '../../types';

/**
 * Creates a `RefContext` & ensures the ref context is never lost (memoized.)
 * This allows a component to create many ref contexts w/o losing them on re-renders.
 * @param ctx The cached/scoped template context
 * @param iterator This is the `Iterator` of cached refs to traverse & return.
 *      If the list is empty, new ones will be created & cached for future renders.
 * @returns RefContext
 */
export const memoizedRefContext =
    (ctx: ComponentContextPartial, iterator: IterableIterator<RefContext>) =>
    // This is the `createRef` prop which is provided to each component & returns the `RefContext`.
    () => {
        let ref: RefContext = iterator.next().value;

        if (ref) {
            return ref;
        }

        ref = refContext();
        ctx.refs?.add(ref);

        return ref;
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
