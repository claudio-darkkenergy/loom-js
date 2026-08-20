import { edgeRequest, edgeResponse } from '../../utils/edge';

export const config = {
    runtime: 'edge'
};

interface GraphQlPayload {
    query?: string;
    variables?: { isPreview?: boolean; [key: string]: unknown };
}

// Reverses the client's base64url(JSON) `q` encoding for the GET transport.
const decodeQueryParam = (encoded: string): GraphQlPayload => {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const utf8Bytes = Uint8Array.from(atob(base64), (char) =>
        char.charCodeAt(0)
    );

    return JSON.parse(new TextDecoder().decode(utf8Bytes));
};

export default async function handler(req: Request) {
    let payload: GraphQlPayload = {};

    if (req.method === 'GET') {
        const encoded = new URL(req.url).searchParams.get('q');

        try {
            payload = encoded ? decodeQueryParam(encoded) : {};
        } catch (_e) {
            // An undecodable `q` falls through as an empty document —
            // Contentful answers with a GraphQL error the client surfaces.
            payload = {};
        }
    } else if (req.method === 'POST') {
        payload = await req.json();
    }

    const isPreview = payload.variables?.isPreview === true;

    return edgeResponse(
        req,
        async () => {
            const environment = 'master';
            const url = `https://graphql.contentful.com/content/v1/spaces/${process.env.CTF_SPACE_ID}/environments/${environment}`;
            const headers = {
                Authorization: `Bearer ${process.env.CTF_TOKEN}`,
                'Content-Type': 'application/json'
            };

            return await edgeRequest(url, {
                body: JSON.stringify(payload),
                headers,
                method: 'post'
            });
        },
        {
            'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
            'Access-Control-Allow-Origin': '*',
            // Delivery API responses are shared-cacheable at the CDN (the
            // cache key is the full URL, so each distinct `q` caches on its
            // own); Preview API responses must always be fetched fresh.
            'Cache-Control': isPreview
                ? 'no-store'
                : 'public, s-maxage=300, stale-while-revalidate=86400'
        }
    );
}
