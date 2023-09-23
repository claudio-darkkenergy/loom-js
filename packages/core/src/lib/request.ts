export interface ResponseJson<DataJson> {
    data?: DataJson;
    errors?: string[];
    status: number;
}

export const handleResponse = <DataJson>({
    data,
    errors
}: Pick<ResponseJson<DataJson>, 'data' | 'errors'>) => {
    if (errors) {
        console.error(errors);
    }

    return data;
};

export const makeRequest = async <DataJson>(
    request: () => Promise<Response>
): Promise<ResponseJson<DataJson>> => {
    let response: Response;

    try {
        response = await request();
    } catch (e) {
        throw Error(e as string);
    }

    if (!response.ok) {
        return {
            errors: [response.statusText],
            status: response.status
        };
    }

    return { data: await response.json(), status: response.status };
};
