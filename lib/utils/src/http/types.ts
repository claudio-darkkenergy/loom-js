export interface ApiProviderResponse<D> {
    data?: D;
    error?: string;
    status: number;
}

export interface RequestInitOptions<D, T> {
    // Adapts the response data to a preferred model.
    adapter?: (data: T) => D;
    cacheKey?: any[];
    // `null` cancels default timeout.
    timeout?: null | number;
    type?: 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text';
}
