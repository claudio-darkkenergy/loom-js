import { Es6Object } from '../types';

// Holds the prop dependency effects per reactive proxy.
const deps = new WeakMap<Es6Object, Map<string | symbol, Set<() => void>>>();
// Holds the active effect per reactive proxy.
const reactiveEffects = new WeakMap<object, null | (() => void)>();

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
    const activeEffect = reactiveEffects.get(proxy);

    if (activeEffect) {
        const propDeps = getDepsForProp(obj, prop);
        propDeps.add(activeEffect);
    }
};
const trigger = (obj: Es6Object, prop: string | symbol) => {
    const propDeps = getDepsForProp(obj, prop);
    propDeps.forEach((effect) => effect());
};

export const updateEffect = <T extends object>(
    update: (proxy: T) => void,
    proxy: T
) => {
    const effect = () => {
        reactiveEffects.set(proxy, effect);
        update(proxy);
        reactiveEffects.set(proxy, null);
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
