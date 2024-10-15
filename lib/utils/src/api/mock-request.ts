import { request } from '../http/request';

export const lazyMock = async <R>(resource: string): Promise<R> =>
    await import(resource);

export const mockRequest = <D>(resource: RequestInfo) =>
    request<D>(resource, {
        headers: { 'Content-type': 'application/json' }
    });
