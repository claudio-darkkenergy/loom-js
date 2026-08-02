import { EdgeResponsePayload } from './edge-request';

export const edgeResponse = async (
    req: Request,
    makeRequest: () => EdgeResponsePayload,
    // A plain header map — the body below indexes and spreads it, which the
    // wider HeadersInit union (Headers | string[][]) does not support.
    resHeaders: Record<string, string>
) => {
    const allowedHeaders = resHeaders['Access-Control-Allow-Headers'];
    const allowedMethods = resHeaders['Access-Control-Allow-Methods'];
    const allowedOrigin = resHeaders['Access-Control-Allow-Origin'];

    if (allowedMethods && !new RegExp(req.method).test(allowedMethods)) {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Handle preflight OPTIONS request.
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                // 'null' is the CORS deny value; the previous `|| null` was
                // string-coerced to it by the Headers constructor anyway.
                'Access-Control-Allow-Origin': allowedOrigin || 'null',
                'Access-Control-Allow-Methods': allowedMethods || '*',
                'Access-Control-Allow-Headers': allowedHeaders || '*'
            }
        });
    }

    // Continue w/ the request for any other allowed request method.
    const { data, error, success } = await makeRequest();
    const resInit: ResponseInit = {
        headers: new Headers({
            'Content-Type': 'application/json',
            ...resHeaders
        })
    };

    if (!success && error) {
        resInit.status = error.code;
        resInit.statusText = error.message;
    }

    return new Response(JSON.stringify({ data: data?.data }), resInit);
};
