import { activity } from '@loom-js/core';

interface Watchable<V> {
    value(): V;
    watch(action: (valueProp: { value: V }) => unknown): () => void;
}

type Values<Sources extends Watchable<any>[]> = {
    [Index in keyof Sources]: Sources[Index] extends Watchable<infer V>
        ? V
        : never;
};

/**
 * An activity computed from several others, recomputed whenever any of them
 * updates — so one effect can render from all of them.
 * @param sources The activities to read.
 * @param compute Builds the derived value from their current values.
 */
export const derive = <Sources extends Watchable<any>[], Result>(
    sources: [...Sources],
    compute: (...values: Values<Sources>) => Result
) => {
    const read = () =>
        compute(
            ...(sources.map((source) => source.value()) as Values<Sources>)
        );
    const derived = activity<Result>(read());

    // Each watch fires once immediately; those first calls change nothing.
    sources.forEach((source) => source.watch(() => derived.update(read())));

    return derived;
};
