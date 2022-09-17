import { memo } from '@app/helpers/cache/memo';
import { ApiProviderResponse } from '@app/types/api';

export type AsyncOperator = <D>(
    cache: Map<string, AsyncOperator>
) => Promise<D>;

export interface RequestOptions<D = any, T = any> {
    // Adapts the response data to a preferred model.
    adapter?: (data: T) => D;
    // `null` cancels default timeout.
    timeout?: null | number;
}

export const requestHeaders = new Headers({
    'Content-Type': 'application/json'
});

export const request = memo(
    async <D, T>(
        cache,
        [input, init]: [RequestInfo, RequestInit & RequestOptions<D, T>]
    ): Promise<ApiProviderResponse<D>> => {
        let res: Response;
        const controller = new AbortController();
        const signal = controller.signal;
        const cacheKey = JSON.stringify([input, init]);

        // Handle request timeout or skip.
        if (init?.timeout !== null) {
            if (typeof init?.timeout !== 'number') {
                // Set default
                init.timeout = 3000;
            }

            setTimeout(() => controller.abort(), init.timeout);
        }

        try {
            res = await fetch(input, {
                ...init,
                signal
            });
            cache.delete(cacheKey);
        } catch (e) {
            cache.delete(cacheKey);
            console.error(e);

            return {
                error: {
                    code: res.status,
                    message: res.statusText
                },
                success: false
            };
        }

        if (!res.ok) {
            return {
                error: {
                    code: res.status,
                    message: res.statusText
                },
                success: false
            };
        }

        const json: T = await res.json();

        return {
            data:
                typeof init?.adapter === 'function'
                    ? init.adapter(json)
                    : (json as unknown as D),
            success: true
        };
    }
);
