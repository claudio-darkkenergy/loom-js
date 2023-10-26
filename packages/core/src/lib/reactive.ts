import { Es6Object } from '../types';

// Holds the active effect per reactive proxy.
const activeEffects = new WeakMap<object, null | (() => void)>();
// Holds the prop dependency effects per reactive proxy.
const deps = new WeakMap<Es6Object, Map<string | symbol, Set<() => void>>>();

const getDepsForProp = (obj: Es6Object, prop: string | symbol) => {
    const objDeps =
        deps.get(obj) || new Map<string | symbol, Set<() => void>>();
    const propDeps = objDeps.get(prop) || new Set<() => void>();

    objDeps.set(prop, propDeps);
    deps.set(obj, objDeps);

    return propDeps;
};
const track = <T extends object>(
    obj: Es6Object,
    prop: string | symbol,
    proxy: T
) => {
    const effect = activeEffects.get(proxy);

    if (effect) {
        const propDeps = getDepsForProp(obj, prop);
        propDeps.add(effect);
    }
};
const trigger = (obj: Es6Object, prop: string | symbol) => {
    const propDeps = getDepsForProp(obj, prop);
    propDeps.forEach((effect) => effect());
};

export const reactiveEffect = <T extends object>(
    update: (proxy: T) => void,
    proxy: T
) => {
    const effect = () => {
        activeEffects.set(proxy, effect);
        update(proxy);
        activeEffects.set(proxy, null);
    };
    effect();
};

export const reactive = <T>(
    origObj: Es6Object<T>,
    shouldUpdate: (oldValue: T, newValue: T) => boolean = (
        oldValue,
        newValue
    ) => oldValue !== newValue
) => {
    const reactiveProxy = new Proxy(origObj, {
        get: function (obj, prop) {
            track(obj, prop, reactiveProxy);
            return obj[prop];
        },
        set: function (obj, prop, newValue) {
            const oldValue = obj[prop];

            if (shouldUpdate(oldValue, newValue)) {
                obj[prop] = newValue;
                trigger(obj, prop);
            }

            return true;
        }
    });

    return reactiveProxy;
};
