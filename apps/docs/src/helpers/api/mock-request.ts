import { USE_MOCKS } from '@app/constants';
import { request, requestHeaders } from '@app/helpers/http/request';

const mockBaseUrl = '@app/mock';
const resourceData = <R>(resource: string): Promise<R> =>
    import(`${mockBaseUrl}${resource}`);

if (USE_MOCKS) {
    console.info('Mocking requests...');
}

export const lazyMock = async <R>(resource: string) =>
    await resourceData<R>(`@app${resource}`);

export const mockRequest = <D, T>(resource: RequestInfo) =>
    request<D, T>(resource, {
        headers: requestHeaders,
        timeout: null
    });
