import { contentfulGraphQlUrl } from './urls';
import { graphQlRequest, GraphQlRequestInit } from '@loom-js/utils';

console.log({ __API_URL__, contentfulGraphQlUrl });

export const contentfulRequest = <D extends unknown, T extends unknown = D>(
    init: GraphQlRequestInit<D | undefined, T>
) =>
    graphQlRequest<D | undefined, T>(contentfulGraphQlUrl, {
        ...init
    });
