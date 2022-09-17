import { mockRequest } from '@app/helpers/api/mock-request';
import { contentfulGraphQlUrl } from '@app/helpers/api/urls';
import {
    requestHeaders as headers,
    request,
    RequestOptions
} from '@app/helpers/http/request';
import { GraphQlRequestPayload } from '@app/types';
import { ContentfulGraphQlResponse } from '@app/types/contentful';

export const contentfulRequest = <D, T = D>({
    query,
    variables = {},
    ...requestConfig
}: RequestInit &
    RequestOptions<D, ContentfulGraphQlResponse<T>> &
    GraphQlRequestPayload) =>
    JSON.parse(process.env.USE_MOCKS)
        ? mockRequest<D, T>(contentfulGraphQlUrl)
        : request<D, ContentfulGraphQlResponse<T>>(contentfulGraphQlUrl, {
              ...requestConfig,
              body: JSON.stringify({
                  query,
                  variables
              }),
              headers,
              method: 'POST'
          });
