import { VercelResponsePayload } from './_vercel-request';

export const vercelResponse = async (payload: VercelResponsePayload) => {
    const { data, error, success } = await payload;
    const resInit: ResponseInit = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (!success && error) {
        resInit.status = error.code;
        resInit.statusText = error.message;
    }

    return new Response(JSON.stringify({ data: data?.data }), resInit);
};
