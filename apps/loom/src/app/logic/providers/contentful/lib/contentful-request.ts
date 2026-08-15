import { graphQlRequest, GraphQlRequestInit } from '@loom-js/utils';

import { contentfulGraphQlUrl } from './urls';

export const contentfulRequest = <D extends unknown, T extends unknown = D>(
    init: GraphQlRequestInit<D | undefined, T>
) =>
    graphQlRequest<D | undefined, T>(contentfulGraphQlUrl, {
        // GET keeps content requests preflight-free and CDN-cacheable.
        method: 'GET',
        ...init
    });
