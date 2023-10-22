import { reactive, updateEffect } from './lib/reactive';
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

export const activity = <V = unknown, I = V>(
    initialValue: V,
    transformOrOptions?: ActivityTransform<V, I> | ActivityOptions,
    options: ActivityOptions = {}
) => {
    // The cached `renderEffect` for the given activity scope.
    let activeEffect: () => void;
    const transformIsSet = typeof transformOrOptions === 'function';
    const transform = transformIsSet ? transformOrOptions : undefined;
    const { deep = false, force = false } = transformIsSet
        ? options
        : transformOrOptions || {};
    const isObject = (value: V) =>
        value !== null && typeof value === 'object' && !Array.isArray(value);
    // Will only shallow clone the passed value if it's a plain object, otherwise returned as is.
    const resolveCurrentValue = (value: V) =>
        isObject(value) && (value as Object).constructor.name === 'Object'
            ? Object.assign({}, value)
            : value;
    let currentValue = resolveCurrentValue(initialValue);
    const shouldUpdate = (oldValue: V, newValue: V) => {
        let valueChanged = false;

        if (force) {
            valueChanged = true;
        } else if (deep && isObject(oldValue) && isObject(newValue)) {
            // Handle Object values when they share the same reference.
            // Allow updates if at least 1 value has changed.
            valueChanged = Object.entries(oldValue as PlainObject).some(
                ([key, value]) => {
                    return value !== (newValue as PlainObject)[key];
                }
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

    isObject(initialValue) && Object.freeze(initialValue);

    return {
        effect(action: ActivityEffectAction<V>) {
            return function activityContextFunction(
                ctx: ComponentContextPartial = {}
            ) {
                const renderEffect = () => {
                    const templateTagValue = action({ value: valueProp.value });
                    ctx.root = textUpdater(
                        ctx.root as TemplateRoot | TemplateRootArray,
                        templateTagValue,
                        ctx
                    );
                };

                // Create a temporary node to be replaced w/ once async node resolves.
                ctx.ctxScopes = ctx.ctxScopes || new Map();

                if (!ctx.root || !activeEffect) {
                    // Set up the reactive effect for the activity.
                    updateEffect(renderEffect, valueProp);
                } else {
                    // Or call the effect, directly, so we don't duplicate the effect reactivity.
                    activeEffect();
                }

                // Caches or updates the cached `renderEffect` for the current activity scope.
                activeEffect = renderEffect;

                return ctx;
            };
        },
        initialValue,
        reset: () => update(initialValue),
        update(valueInput: I) {
            typeof transform === 'function'
                ? transform({
                      input: valueInput,
                      update,
                      value: value()
                  })
                : update(valueInput as unknown as V);
        },
        // Returns a shallow copy of the current value.
        value,
        watch(action: (valueProp: ValueProp<V>) => any) {
            updateEffect((valueProp) => {
                action({ value: valueProp.value });
            }, valueProp);
        }
    };
};
