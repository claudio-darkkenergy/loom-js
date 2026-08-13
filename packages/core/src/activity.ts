import { ATTR_BINDING, AttrBinding } from './lib/attr-binding';
import { appendChildContext } from './lib/context';
import { isObject, shallowDiffArray, shallowDiffObject } from './lib/helpers';
import { reactive, reactiveEffect } from './lib/reactive';
import { textUpdater } from './lib/templating/get-text-update';
import type {
    ActivityEffectAction,
    ActivityOptions,
    ActivityTransform,
    ComponentContextPartial,
    PlainObject,
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
    const { deep = false, force = false } = transformIsSet
        ? options
        : transformOrOptions || {};
    let forceAtThisMoment = force;
    // Shallow-clones the passed value so consumers can't mutate the stored current value and defeat
    // change detection. Plain objects and arrays get a fresh reference; other types pass through.
    // @TODO Also create new references for other types, i.e. Map, Set, etc.
    const resolveCurrentValue = (value: V) =>
        Array.isArray(value)
            ? (value.slice() as V)
            : isObject(value) && (value as Object).constructor.name === 'Object'
              ? Object.assign({}, value)
              : value;
    let currentValue = resolveCurrentValue(initialValue);
    const shouldUpdate = (oldValue: V, newValue: V) => {
        let valueChanged = false;

        if (forceAtThisMoment) {
            valueChanged = true;
        } else if (deep && Array.isArray(oldValue) && Array.isArray(newValue)) {
            // Compare arrays element-by-element (positional) so a same-content
            // update doesn't cascade to subscribed effects.
            valueChanged = shallowDiffArray(oldValue, newValue);
        } else if (deep && isObject(oldValue) && isObject(newValue)) {
            // Compare the Object values at the property level.
            // Allow updates if at least 1 value has changed.
            valueChanged = shallowDiffObject(
                oldValue as PlainObject,
                newValue as PlainObject
            );
        } else {
            valueChanged = oldValue !== newValue;
        }

        currentValue = valueChanged ? resolveCurrentValue(newValue) : oldValue;
        return valueChanged;
    };
    const valueProp: ValueProp<V> = reactive(
        { value: currentValue },
        shouldUpdate
    ) as {
        value: V;
    };
    // Update Handler
    const update = (valueInput: V) => {
        valueProp.value = valueInput;
    };
    const value = () => {
        return resolveCurrentValue(currentValue);
    };

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
        reset: () => update(initialValue),
        update(valueInput: I, forceUpdate = forceAtThisMoment) {
            forceAtThisMoment = forceUpdate;
            typeof transform === 'function'
                ? transform({
                      input: valueInput,
                      update,
                      value: value()
                  })
                : update(valueInput as unknown as V);
            forceAtThisMoment = force;
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
