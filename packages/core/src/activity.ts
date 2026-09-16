import { createTransformDispatcher } from './lib/activity/transform-dispatch';
import { createValueStore } from './lib/activity/value-store';
import { ATTR_BINDING, AttrBinding } from './lib/attr-binding';
import { appendChildContext } from './lib/context';
import { isObject } from './lib/helpers';
import { reactiveEffect } from './lib/reactive';
import { textUpdater } from './lib/templating/get-text-update';
import type {
    ActivityEffectAction,
    ActivityOptions,
    ActivityTransform,
    ComponentContextPartial,
    ReadonlyInput,
    TemplateRoot,
    TemplateRootArray,
    TemplateTagValue,
    ValueProp
} from './types';

export const activity = <V, I = V>(
    initialValue: V,
    transformOrOptions?: ActivityTransform<V, I> | ActivityOptions<V, I>,
    options: ActivityOptions<V, I> = {}
) => {
    // Holds the latest scoped action per `ctx` so that any update will be called in the correct scope.
    const scopedActions = new Map<
        ComponentContextPartial,
        ActivityEffectAction<V>
    >();
    const transformIsSet = typeof transformOrOptions === 'function';
    const transform = transformIsSet
        ? transformOrOptions
        : isObject(transformOrOptions)
          ? transformOrOptions?.transform
          : undefined;
    const {
        concurrency = 'latest',
        deep = false,
        force = false,
        timeout
    } = transformIsSet ? options : transformOrOptions || {};
    // The value cell — storage, clone isolation, change detection.
    const { commit, dispatchWithForce, forceNow, value, valueProp } =
        createValueStore(initialValue, { deep, force });
    // The run machinery — supersession, ordering, timeout, settlement.
    const dispatchTransformRun = createTransformDispatcher<V>({
        commit,
        concurrency,
        timeout
    });

    try {
        isObject(initialValue) && Object.freeze(initialValue);
    } catch (_e) {
        // The initial value will not pass through Object-freeze since it can't be frozen.
        // No harm, no foul - there's a good reason.
    }

    return {
        /**
         * Creates an attribute binding for template attr slots — the bound
         * attribute applies `select` of the current value immediately and
         * stays in sync with every update, without re-rendering the host
         * component. Cleanup is automatic: the templating layer disposes the
         * binding when a re-render replaces the slot's value and on unmount
         * teardown. Prefer this over an `effect` boundary when only an
         * attribute depends on the activity.
         * @param select Projects the activity value to the attribute value;
         *      defaults to identity.
         * @returns An `AttrBinding` to interpolate as an attribute value.
         */
        bind(
            select: (bindValue: V) => TemplateTagValue = (bindValue) =>
                bindValue as unknown as TemplateTagValue
        ): AttrBinding<V> {
            return {
                [ATTR_BINDING]: true,
                select,
                watch: (action) =>
                    reactiveEffect(
                        () => action({ value: valueProp.value }),
                        valueProp
                    )
            };
        },
        effect(action: ActivityEffectAction<V>) {
            return function activityContextFunction(
                ctx: ComponentContextPartial = {}
            ) {
                const renderEffect = () => {
                    const scopedAction = scopedActions.get(ctx);
                    const templateTagValue =
                        scopedAction &&
                        scopedAction({ value: valueProp.value });

                    ctx.root = textUpdater(
                        ctx.root as TemplateRoot | TemplateRootArray,
                        templateTagValue,
                        typeof templateTagValue === 'function' &&
                            templateTagValue.name === 'activityContextFunction'
                            ? appendChildContext(ctx, templateTagValue, 0)
                            : ctx
                    );
                };

                // Ensure the `ctx` has a `ctxScopes` map.
                ctx.ctxScopes = ctx.ctxScopes || new Map();

                // Handle when `effect` is 1st called.
                if (!ctx.root || !scopedActions.has(ctx)) {
                    // Set the current action scope.
                    scopedActions.set(ctx, action);
                    // Set up the reactive effect for the activity.
                    const disposeRenderEffect = reactiveEffect(
                        renderEffect,
                        valueProp
                    );

                    // Register the unmount cleanup — dispose the render
                    // effect and release this context from the activity's
                    // scoped actions so it stops pinning the context (and
                    // its DOM) once the subtree is genuinely detached.
                    ctx.teardowns = ctx.teardowns || new Set();
                    ctx.teardowns.add(() => {
                        disposeRenderEffect();
                        scopedActions.delete(ctx);
                    });
                }
                // Handle when `effect` is recalled.
                else {
                    // Update the current action scope.
                    scopedActions.set(ctx, action);
                    // & call the effect, directly, so we don't duplicate the effect reactivity.
                    renderEffect();
                }

                return ctx;
            };
        },
        initialValue,
        // An ordinary dispatch that bypasses the transform — it supersedes,
        // queues, or buffers like any other run, so an in-flight transform
        // can't stomp a reset (and vice versa).
        reset: () =>
            typeof transform === 'function'
                ? dispatchTransformRun((runUpdate) => runUpdate(initialValue))
                : commit(initialValue),
        update(valueInput: I, forceUpdate = forceNow()) {
            dispatchWithForce(forceUpdate, () =>
                typeof transform === 'function'
                    ? // Dispatched as a run — supersession, ordering, timeout
                      // and the `settled()` signal all hang off the run.
                      dispatchTransformRun((runUpdate, signal) =>
                          transform({
                              input: valueInput as ReadonlyInput<I>,
                              signal,
                              update: runUpdate,
                              value: value()
                          })
                      )
                    : commit(valueInput as unknown as V)
            );
        },
        // Returns a shallow copy of the current value.
        value,
        /**
         * Registers a caller-managed watcher — the action runs immediately
         * with the current value, then on every update, until the returned
         * unsubscriber is invoked. Unlike `effect`, whose subscription is
         * managed through its component context, `watch` cleanup is the
         * caller's responsibility (e.g. pair it with `onUnmounted`).
         * @param action A handler receiving the current `ValueProp`.
         * @returns An `Unsubscriber` that permanently stops the watcher.
         */
        watch(action: (valueProp: ValueProp<V>) => any) {
            return reactiveEffect(
                () => action({ value: valueProp.value }),
                valueProp
            );
        }
    };
};
