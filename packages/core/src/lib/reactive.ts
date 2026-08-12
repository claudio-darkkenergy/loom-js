import { Es6Object, Unsubscriber } from '../types';

// An effect closure plus its disposal state: `memberships` is the reverse
// index of every dependency set holding the effect, so `dispose` can remove
// it everywhere; `disposed` guards against a triggered-or-running effect
// re-tracking itself back in after disposal.
type Effect = {
    (): void;
    disposed?: boolean;
    memberships?: Set<Set<Effect>>;
};

// Holds the active effect per reactive proxy.
const activeEffects = new WeakMap<object, null | Effect>();
// Holds the prop dependency effects per reactive proxy.
const deps = new WeakMap<Es6Object, Map<string | symbol, Set<Effect>>>();

const getDepsForProp = (obj: Es6Object, prop: string | symbol) => {
    const objDeps = deps.get(obj) || new Map<string | symbol, Set<Effect>>();
    const propDeps = objDeps.get(prop) || new Set<Effect>();

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

    if (effect && !effect.disposed) {
        const propDeps = getDepsForProp(obj, prop);
        propDeps.add(effect);
        effect.memberships?.add(propDeps);
    }
};
const trigger = (obj: Es6Object, prop: string | symbol) => {
    const propDeps = getDepsForProp(obj, prop);
    propDeps.forEach((effect) => effect());
};

export const reactiveEffect = <T extends object>(
    update: (proxy: T) => void,
    proxy: T
): Unsubscriber => {
    const effect: Effect = () => {
        if (effect.disposed) {
            return;
        }

        activeEffects.set(proxy, effect);
        update(proxy);
        activeEffects.set(proxy, null);
    };

    effect.memberships = new Set<Set<Effect>>();
    effect();

    // Disposes the effect — removes it from every dependency set it was
    // tracked into. Idempotent.
    return () => {
        if (effect.disposed) {
            return;
        }

        effect.disposed = true;
        effect.memberships?.forEach((propDeps) => propDeps.delete(effect));
        effect.memberships?.clear();
    };
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
            const oldValue = obj[prop] as any;

            if (shouldUpdate(oldValue, newValue)) {
                obj[prop] = newValue;
                trigger(obj, prop);
            }

            return true;
        }
    });

    return reactiveProxy;
};
