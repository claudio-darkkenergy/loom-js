import { appendChildContext } from './lib/context';
import { isObject, shallowDiffObject } from './lib/helpers';
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
    // Will only shallow clone the passed value if it's a plain object, otherwise returned as is.
    // @TODO Also create new references for other types, i.e. Array, Map, Set, etc.
    const resolveCurrentValue = (value: V) =>
        isObject(value) && (value as Object).constructor.name === 'Object'
            ? Object.assign({}, value)
            : value;
    let currentValue = resolveCurrentValue(initialValue);
    const shouldUpdate = (oldValue: V, newValue: V) => {
        let valueChanged = false;

        if (forceAtThisMoment) {
            valueChanged = true;
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

                // Create a temporary node to be replaced w/ once async node resolves.
                ctx.ctxScopes = ctx.ctxScopes || new Map();

                // Handle when `effect` is 1st called.
                if (!ctx.root || !scopedActions.has(ctx)) {
                    // Set the current action scope.
                    scopedActions.set(ctx, action);
                    // Set up the reactive effect for the activity.
                    reactiveEffect(renderEffect, valueProp);
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
        watch(action: (valueProp: ValueProp<V>) => any) {
            reactiveEffect(() => action({ value: valueProp.value }), valueProp);
        }
    };
};
