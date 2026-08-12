import type { ApiProviderResponse, RequestInitOptions } from './types';

type RequestDataCacheMeta = {
    cacheKey?: any[];
    result: ApiProviderResponse<unknown>;
};

// In-flight requests shared per signature — concurrent identical calls await
// one fetch (single flight) instead of racing or cancelling each other.
const inflightRequests = new Map<
    string,
    Promise<ApiProviderResponse<unknown>>
>();
const requestDataCache = new Map<string, RequestDataCacheMeta>();

// `true` when the caller supplied a cache key and any of its values changed
// relative to the stored key (including a length change).
const cacheKeyChanged = (incomingKey?: any[], storedKey?: any[]) =>
    !!incomingKey &&
    (incomingKey.length !== storedKey?.length ||
        incomingKey.some(
            (keyValue, keyIndex) => !Object.is(keyValue, storedKey?.[keyIndex])
        ));

export const request = async function makeRequest<D, T>(
    input: RequestInfo,
    init: RequestInit & RequestInitOptions<D, T>
): Promise<ApiProviderResponse<D>> {
    // `cacheKey` identifies when a cached entry goes stale, so it must not
    // participate in the signature that identifies which entry that is.
    const { cacheKey, ...signatureInit } = init;
    const reqSignature = JSON.stringify({ input, init: signatureInit });

    // Bust the cache if a key was provided & any key value has changed.
    if (
        requestDataCache.has(reqSignature) &&
        cacheKeyChanged(cacheKey, requestDataCache.get(reqSignature)?.cacheKey)
    ) {
        requestDataCache.delete(reqSignature);
    }

    const cached = requestDataCache.get(reqSignature);

    if (cached) {
        return cached.result as ApiProviderResponse<D>;
    }

    // Join an identical in-flight request instead of fetching again.
    const inflight = inflightRequests.get(reqSignature);

    if (inflight) {
        return inflight as Promise<ApiProviderResponse<D>>;
    }

    const flight = (async (): Promise<ApiProviderResponse<D>> => {
        let res: Response;
        let status = 0;
        const controller = new AbortController();

        // Handle request timeout — aborts the shared flight if it is still
        // airborne when the timer fires.
        init.timeout &&
            setTimeout(
                () =>
                    inflightRequests.has(reqSignature) &&
                    controller.abort(
                        `The request timed out after ${init.timeout} seconds.`
                    ),
                init.timeout
            );

        try {
            res = await fetch(input, {
                ...init,
                headers: init.headers && new Headers(init.headers),
                signal: controller.signal
            });

            if (!res.ok) {
                status = res.status;
                throw new Error(res.statusText);
            }
        } catch (caught: unknown) {
            const error = caught as { message: string; status: number };

            console.error(caught);
            // Error results are returned, not thrown — and never cached, so
            // the next call retries.
            return { error: error.message, status: status || error.status };
        }

        const body: T = await res[init.type || 'json']();
        const result: ApiProviderResponse<D> = {
            data:
                typeof init?.adapter === 'function'
                    ? init.adapter(body)
                    : (body as unknown as D),
            status: res.status
        };

        // Only successful responses are cached.
        requestDataCache.set(reqSignature, { cacheKey, result });

        return result;
    })();

    inflightRequests.set(
        reqSignature,
        flight as Promise<ApiProviderResponse<unknown>>
    );

    try {
        return await flight;
    } finally {
        inflightRequests.delete(reqSignature);
    }
};
