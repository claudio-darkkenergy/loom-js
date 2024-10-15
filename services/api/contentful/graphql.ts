import { edgeRequest, edgeResponse } from '../../utils/edge';

export const config = {
    runtime: 'edge'
};

export default async function POST(req: Request) {
    return edgeResponse(
        req,
        async () => {
            const environment = 'master';
            const url = `https://graphql.contentful.com/content/v1/spaces/${process.env.CTF_SPACE_ID}/environments/${environment}`;
            const body: BodyInit = await req.json();
            const headers = {
                Authorization: `Bearer ${process.env.CTF_TOKEN}`,
                'Content-Type': 'application/json'
            };

            return await edgeRequest(url, {
                body: JSON.stringify(body),
                headers,
                method: 'post'
            });
        },
        {
            'Access-Control-Allow-Methods': 'OPTIONS, POST',
            'Access-Control-Allow-Origin': '*'
        }
    );
}
