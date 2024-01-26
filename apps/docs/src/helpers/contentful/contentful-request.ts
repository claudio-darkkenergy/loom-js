import { USE_MOCKS } from '@app/constants';
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
    url = contentfulGraphQlUrl,
    ...requestConfig
}: RequestInit &
    RequestOptions<ContentfulGraphQlResponse<D>, T> &
    GraphQlRequestPayload & { url: RequestInfo }) =>
    USE_MOCKS
        ? mockRequest<D, T>(url)
        : request<ContentfulGraphQlResponse<D>, T>(url, {
              ...requestConfig,
              body: JSON.stringify({
                  query,
                  variables
              }),
              headers,
              method: 'POST'
          });
