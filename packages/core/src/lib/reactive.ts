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

// What one reactive proxy tracks: the effect running against it right now
// and, per property of its target, the effects that read it.
interface ReactiveState {
    active: Effect | null;
    deps: Map<string | symbol, Set<Effect>>;
}

// The state behind each reactive proxy — looked up once per effect, so a
// run or a tracked read touches no weak map.
const states = new WeakMap<object, ReactiveState>();
// The dependency sets per target, shared by every proxy over it.
const targetDeps = new WeakMap<Es6Object, Map<string | symbol, Set<Effect>>>();

const track = (state: ReactiveState, prop: string | symbol) => {
    const effect = state.active;

    if (!effect || effect.disposed) {
        return;
    }

    let propDeps = state.deps.get(prop);

    if (!propDeps) {
        propDeps = new Set<Effect>();
        state.deps.set(prop, propDeps);
    }

    if (!propDeps.has(effect)) {
        propDeps.add(effect);
        effect.memberships?.add(propDeps);
    }
};
const trigger = (state: ReactiveState, prop: string | symbol) => {
    state.deps.get(prop)?.forEach((effect) => effect());
};

export const reactiveEffect = <T extends object>(
    update: (proxy: T) => void,
    proxy: T
): Unsubscriber => {
    // A proxy `reactive` did not make tracks nothing; its effect still runs.
    const state = states.get(proxy);
    const effect: Effect = () => {
        if (effect.disposed) {
            return;
        }

        state && (state.active = effect);
        update(proxy);
        state && (state.active = null);
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
    let deps = targetDeps.get(origObj);

    if (!deps) {
        deps = new Map();
        targetDeps.set(origObj, deps);
    }

    const state: ReactiveState = { active: null, deps };
    const reactiveProxy = new Proxy(origObj, {
        get: function (obj, prop) {
            track(state, prop);
            return obj[prop];
        },
        set: function (obj, prop, newValue) {
            const oldValue = obj[prop] as any;

            if (shouldUpdate(oldValue, newValue)) {
                obj[prop] = newValue;
                trigger(state, prop);
            }

            return true;
        }
    });

    states.set(reactiveProxy, state);

    return reactiveProxy;
};
