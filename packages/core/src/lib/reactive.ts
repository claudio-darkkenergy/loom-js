import { Es6Object } from '../types';

let activeEffect: null | (() => void) = null;
const deps = new WeakMap<Es6Object, Map<string | symbol, Set<() => void>>>();

const getDepsForProp = (obj: Es6Object, prop: string | symbol) => {
    const objDeps =
        deps.get(obj) || new Map<string | symbol, Set<() => void>>();
    const propDeps = objDeps.get(prop) || new Set<() => void>();

    objDeps.set(prop, propDeps);
    deps.set(obj, objDeps);

    return propDeps;
};

const track = (obj: Es6Object, prop: string | symbol) => {
    if (activeEffect) {
        const propDeps = getDepsForProp(obj, prop);
        propDeps.add(activeEffect);
    }
};
const trigger = (obj: Es6Object, prop: string | symbol) => {
    const propDeps = getDepsForProp(obj, prop);
    propDeps.forEach((effect) => effect());
};

export const updateEffect = <T>(update: (proxy: T) => void, proxy: T) => {
    const effect = () => {
        activeEffect = effect;
        update(proxy);
        activeEffect = null;
    };
    effect();
};

export const reactive = <T>(
    origObj: Es6Object<T>,
    shouldUpdate: (oldValue: T, newValue: T) => boolean = (
        oldValue,
        newValue
    ) => oldValue !== newValue
) =>
    new Proxy(origObj, {
        get: function (obj, prop) {
            track(obj, prop);
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
