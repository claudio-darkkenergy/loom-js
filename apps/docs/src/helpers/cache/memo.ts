export interface MemoFunc {
    (cacheClean: () => boolean, ...args: any[]): any | Promise<any>;
}

export const memo = (cachedProcess: MemoFunc) => {
    const cache = new Map<string, ReturnType<typeof cachedProcess>>();

    // Memoized Function.
    return (...args: any[]) => {
        const sig = JSON.stringify(args);

        if (!cache.has(sig)) {
            // The request is not pending execution and/or resolution.
            // Not yet cached.
            const cacheClean = () => cache.delete(sig);
            const pendingValue = cachedProcess(cacheClean, ...args);

            pendingValue && cache.set(sig, pendingValue);
            return pendingValue;
        }

        return cache.get(sig);
    };
};
