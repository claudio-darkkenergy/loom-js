import { graphQlRequest, GraphQlRequestInit } from '@loom-js/utils';

import { contentfulGraphQlUrl } from './urls';

export const contentfulRequest = <D extends unknown, T extends unknown = D>(
    init: GraphQlRequestInit<D | undefined, T>
) =>
    graphQlRequest<D | undefined, T>(contentfulGraphQlUrl, {
        ...init
    });
