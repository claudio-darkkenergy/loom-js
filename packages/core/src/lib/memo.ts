export interface MemoFunc<T extends unknown[], R> {
    (cleanCache: () => boolean, ...args: T): R;
}

export const memo = <T extends unknown[], R = unknown>(
    cachedProcess: MemoFunc<T, R>,
    cacheKey: (...args: T) => unknown = (...args) => JSON.stringify(args)
) => {
    const cache = new Map<unknown, ReturnType<typeof cachedProcess>>();
    const getCacheCleanupFn = (sig: unknown) => () => cache.delete(sig);

    // Memoized Function.
    return (...args: T) => {
        const sig = cacheKey(...args);

        if (!cache.has(sig)) {
            // Not yet cached.
            const pendingValue = cachedProcess(getCacheCleanupFn(sig), ...args);

            pendingValue && cache.set(sig, pendingValue);
            return pendingValue;
        }

        return cache.get(sig) as R;
    };
};
