import { RequestInitOptions } from '../http';

export interface GraphQlQueryOptions {
    args?: string[];
    fragments?: string[];
    queries: string[];
    queryLabel?: string;
    queryType?: 'query' | 'mutation';
}

export type GraphQlRequestInit<D, T> = RequestInit &
    RequestInitOptions<D, GraphQlResponse<T>> &
    GraphQlRequestPayload;

export interface GraphQlRequestPayload {
    query: string;
    variables?: { isPreview?: boolean; [key: string]: any };
}

export interface GraphQlError {
    locations: GraphQlErrorLocation[];
    message: string;
}

export interface GraphQlErrorLocation {
    column: number;
    line: number;
}

export interface GraphQlResponse<D> {
    data?: D;
    errors?: GraphQlError[];
}
