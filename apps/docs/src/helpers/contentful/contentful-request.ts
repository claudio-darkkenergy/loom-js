import { mockRequest } from '@app/helpers/api/mock-request';
import { contentfulGraphQlUrl } from '@app/helpers/api/urls';
import {
    requestHeaders as headers,
    request,
    RequestOptions
} from '@app/helpers/http/request';
import { GraphQlRequestPayload } from '@app/types';
import { ContentfulGraphQlResponse } from '@app/types/contentful';

export const contentfulRequest = <D extends {}, T = D>({
    query,
    variables = {},
    ...requestConfig
}: RequestInit &
    RequestOptions<ContentfulGraphQlResponse<D>, T> &
    GraphQlRequestPayload) =>
    __USE_MOCKS__
        ? mockRequest<D, T>(contentfulGraphQlUrl)
        : request<ContentfulGraphQlResponse<D>, T>(contentfulGraphQlUrl, {
              ...requestConfig,
              body: JSON.stringify({
                  query,
                  variables
              }),
              headers,
              method: 'POST'
          });
