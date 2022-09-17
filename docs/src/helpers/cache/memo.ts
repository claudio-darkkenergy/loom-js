export const memo = <
    F extends <_D, _T>(
        cache: Map<string, ReturnType<F>>,
        args: readonly [...any[]]
    ) => ReturnType<F>
>(
    cachedProcess: F
) => {
    const cache = new Map<string, ReturnType<F>>();

    return <D, T = D>(...args: readonly [...any[]]) => {
        const sig = JSON.stringify(args);

        if (!cache.has(sig)) {
            // The request is not pending execution and/or resolution - not yet cached.
            const pendingValue = cachedProcess<D, T>(
                cache,
                ...([args] as const)
            );

            cache.set(sig, pendingValue);
            return pendingValue;
        }

        return cache.get(sig);
    };
};
