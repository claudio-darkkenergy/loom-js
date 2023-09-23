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
    TemplateTagValue,
    ValueProp
} from './types';

export const activity = <V = unknown, I = V>(
    initialValue: V,
    transformOrOptions?: ActivityTransform<V, I> | ActivityOptions,
    options: ActivityOptions = {}
) => {
    const transformIsSet = typeof transformOrOptions === 'function';
    const transform = transformIsSet ? transformOrOptions : undefined;
    const { deep = false, force = false } = transformIsSet
        ? options
        : transformOrOptions || {};
    const isObject = (value: V) =>
        typeof value === 'object' && !Array.isArray(value);
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
        Object.assign(valueProp, { value: valueInput });
    };
    const value = () => {
        return resolveCurrentValue(currentValue);
    };

    isObject(initialValue) && Object.freeze(initialValue);

    return {
        effect(action: ActivityEffectAction<V>) {
            function contextFunction(ctx: ComponentContextPartial = {}) {
                const renderEffect = (templateTagValue: TemplateTagValue) => {
                    ctx.root = textUpdater(
                        ctx.root as TemplateRoot | TemplateRootArray,
                        templateTagValue,
                        ctx
                    );

                    // setParentOnContext(ctx);
                };

                const activityEffect = (valueProp: ValueProp<V>) => {
                    const templateTagValue = action({ value: valueProp.value });

                    if (templateTagValue instanceof Promise) {
                        templateTagValue.then(renderEffect);
                    } else {
                        renderEffect(templateTagValue);
                    }
                };

                // Create a temporary node to be replaced w/ once async node resolves.
                ctx.root = ctx.root || document.createTextNode('');
                ctx.ctxScopes = new Map();
                // Set up the reactive effect for the activity.
                updateEffect(activityEffect, valueProp);
                return ctx;
            }

            return contextFunction;
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
