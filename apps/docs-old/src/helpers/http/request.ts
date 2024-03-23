import { MemoFunc, memo } from '@app/helpers/cache/memo';
import { ApiProviderResponse } from '@app/types/api';

export interface RequestOptions<
    TResponseData = undefined,
    TAdaptedResponseData = TResponseData
> {
    // Adapts the response data to a preferred model.
    adapter?: (data: TResponseData) => TAdaptedResponseData;
    // `null` cancels default timeout.
    timeout?: null | number;
}

const memoFunc: MemoFunc = async (
    cacheClean,
    input: RequestInfo,
    init: RequestInit & RequestOptions = {
        timeout: 3000
    }
) => {
    let res: Response;
    const controller = new AbortController();
    const signal = controller.signal;

    // Handle request timeout or skip.
    init.timeout !== null &&
        setTimeout(
            () => controller.abort(),
            Number.isNaN(Number(init.timeout)) ? 3000 : init.timeout
        );

    try {
        res = await fetch(input, {
            ...init,
            signal
        });
        cacheClean();
    } catch (e) {
        cacheClean();
        console.error(e);

        return {
            error: {
                code: 400,
                message: e as string
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

    const json = await res.json();

    return {
        data: typeof init.adapter === 'function' ? init.adapter(json) : json,
        success: true
    };
};
const memoizedFunc = memo(memoFunc);

export const request = <
    TResponseData = undefined,
    TAdaptedResponseData = TResponseData
>(
    input: RequestInfo,
    init?: RequestInit & RequestOptions<TResponseData, TAdaptedResponseData>
): Promise<ApiProviderResponse<TAdaptedResponseData>> => {
    return memoizedFunc(input, init);
};

export const requestHeaders = new Headers({
    'Content-Type': 'application/json'
});
