import { GraphQlResponse } from './types';
import {
    type GraphQlRequestPayload,
    request,
    type RequestInitOptions
} from '@loom-js/utils';

export type GraphQlRequestInit<D, T> = RequestInit &
    RequestInitOptions<D, GraphQlResponse<T>> &
    GraphQlRequestPayload;

/**
 * Performs a GraphQL request to the specified URL.
 *
 * @param {RequestInfo} info - The URL to query.
 * @param {GraphQlRequestInit<D, T>} options - The request options.
 * @param {string} [options.query] - The GraphQL query as a string.
 * @param {object} [options.variables] - The query variables.
 */
export const graphQlRequest = <D, T>(
    info: RequestInfo,
    {
        headers,
        query,
        variables = {},
        ...requestConfig
    }: GraphQlRequestInit<D, T>
) =>
    request<D, GraphQlResponse<T>>(info, {
        ...requestConfig,
        body: JSON.stringify({
            query,
            variables
        }),
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        method: 'POST'
    });
