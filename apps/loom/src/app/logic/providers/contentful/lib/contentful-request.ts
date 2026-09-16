import { graphQlRequest, GraphQlRequestInit } from '@loom-js/utils';

import { contentfulGraphQlUrl } from './urls';

export interface ContentfulTransport {
    headers?: Record<string, string>;
    method?: 'GET' | 'POST';
    url: string;
}

// The runtime default: the edge proxy over GET — preflight-free,
// CDN-cacheable, and the proxy holds the auth.
let transport: ContentfulTransport = { url: contentfulGraphQlUrl };

/**
 * Points every provider at a different GraphQL transport. The browser keeps
 * the proxy default; the build-time prerender pass swaps in Contentful's
 * endpoint with the Delivery token. Same queries either way.
 */
export const setContentfulTransport = (next: ContentfulTransport) => {
    transport = next;
};

export const contentfulRequest = <D extends unknown, T extends unknown = D>(
    init: GraphQlRequestInit<D | undefined, T>
) =>
    graphQlRequest<D | undefined, T>(transport.url, {
        headers: transport.headers,
        method: transport.method ?? 'GET',
        ...init
    });
