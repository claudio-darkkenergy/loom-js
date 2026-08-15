import { request } from '@loom-js/utils';

import { type GraphQlRequestInit, GraphQlResponse } from './types';

// Encodes the GraphQL payload for the GET transport — UTF-8 first so `btoa`
// accepts any document content, then base64url so it rides safely in a
// query param.
const encodeQueryParam = (payload: {
    query: string;
    variables: object;
}): string => {
    const utf8Bytes = new TextEncoder().encode(JSON.stringify(payload));
    let binary = '';

    utf8Bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

/**
 * Performs a GraphQL request to the specified URL.
 *
 * @param {RequestInfo} info - The URL to query.
 * @param {GraphQlRequestInit<D, T>} options - The request options.
 * @param {'GET' | 'POST'} [options.method] - The transport. `GET` sends the
 * document as a base64url `q` query param with no custom headers, so the
 * request needs no CORS preflight and its response is CDN-cacheable.
 * Defaults to `POST`.
 * @param {string} [options.query] - The GraphQL query as a string.
 * @param {object} [options.variables] - The query variables.
 */
export const graphQlRequest = <D, T>(
    info: RequestInfo,
    {
        headers,
        method = 'POST',
        query,
        variables = {},
        ...requestConfig
    }: GraphQlRequestInit<D, T>
) =>
    method === 'GET'
        ? request<D, GraphQlResponse<T>>(
              `${info}?q=${encodeQueryParam({ query, variables })}`,
              {
                  ...requestConfig,
                  method: 'GET'
              }
          )
        : request<D, GraphQlResponse<T>>(info, {
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
