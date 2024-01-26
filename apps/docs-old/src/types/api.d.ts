export interface ApiProviderError {
    code: number;
    message: string;
}

export interface ApiProviderResponse<D = undefined> {
    data?: D;
    error?: ApiProviderError;
    success: boolean;
}
