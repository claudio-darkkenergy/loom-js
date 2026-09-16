import type { PlainObject, ValueProp } from '../../types';
import { isObject, shallowDiffArray, shallowDiffObject } from '../helpers';
import { reactive } from '../reactive';

export interface ValueStoreOptions {
    deep: boolean;
    force: boolean;
}

/**
 * The reactive value cell behind an activity — shallow-clone isolation,
 * change detection (`deep`/`force`), and the raw commit path. One concern:
 * how a value is stored and when a write counts as a change.
 */
export const createValueStore = <V>(
    initialValue: V,
    { deep, force }: ValueStoreOptions
) => {
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

    return {
        // The raw commit path — every stored write lands here.
        commit(valueInput: V) {
            valueProp.value = valueInput;
        },
        // Applies `forceUpdate` to every commit made synchronously within
        // `dispatch`, then restores the configured default — async commits
        // from a transform run use the default, as before.
        dispatchWithForce(forceUpdate: boolean, dispatch: () => void) {
            forceAtThisMoment = forceUpdate;
            dispatch();
            forceAtThisMoment = force;
        },
        // The force flag in effect right now — the default for a dispatch
        // that doesn't pass its own.
        forceNow: () => forceAtThisMoment,
        // Returns a shallow copy of the current value.
        value: () => resolveCurrentValue(currentValue),
        valueProp
    };
};
