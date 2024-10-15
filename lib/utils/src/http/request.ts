import type { ApiProviderResponse, RequestInitOptions } from './types';

type RequestDataCacheMeta = {
    cacheKey?: any[];
    result: ApiProviderResponse<unknown>;
};

const pendingRequests = new Map<string, Set<AbortController>>();
const requestDataCache = new Map<string, RequestDataCacheMeta>();

export const request = async function makeRequest<D, T>(
    // purge: CacheKeyPurger,
    input: RequestInfo,
    init: RequestInit & RequestInitOptions<D, T>
): Promise<ApiProviderResponse<D>> {
    const reqSignature = JSON.stringify({ input, init });

    // Bust the cache if a key was provide & any key value has changed.
    if (init.cacheKey && requestDataCache.has(reqSignature)) {
        const { cacheKey } = requestDataCache.get(
            reqSignature
        ) as RequestDataCacheMeta;
        if (
            cacheKey &&
            cacheKey.some((key, i) => !Object.is(key, cacheKey[i]))
        ) {
            requestDataCache.delete(reqSignature);
        }
    }

    if (!requestDataCache.has(reqSignature)) {
        let res: Response;
        let status = 0;
        const controllerQueue =
            pendingRequests.get(reqSignature) || new Set<AbortController>();
        const controller = new AbortController();

        // Add the controller queue to the pending request.
        pendingRequests.set(reqSignature, controllerQueue);

        // Abort all pending requests.
        controllerQueue?.forEach((ctrl) =>
            ctrl.abort(
                'A repeat request caused an inflight request to be cancelled.'
            )
        );

        // Queue the controller.
        controllerQueue.add(controller);

        // Handle request timeout.
        init.timeout &&
            setTimeout(
                () =>
                    controllerQueue?.has(controller) &&
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
        } catch (e: unknown) {
            const error = e as { message: string; status: number };

            console.error(e);
            return { error: error.message, status: status || error.status };
        }

        // Dequeue the controller.
        controllerQueue.delete(controller);

        // Dequeue the pending request.
        controllerQueue.size && pendingRequests.delete(reqSignature);

        const body: T = await res[init.type || 'json']();
        requestDataCache.set(reqSignature, {
            cacheKey: init.cacheKey,
            result: {
                data:
                    typeof init?.adapter === 'function'
                        ? init.adapter(body)
                        : (body as unknown as D),
                status: res.status
            }
        });
    }

    return requestDataCache.get(reqSignature)?.result as ApiProviderResponse<D>;
};
