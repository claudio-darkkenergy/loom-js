import { vercelRequest, vercelResponse } from '../_utils';

const contentfulGraphQl = async (req: Request) => {
    const environment = 'master';
    const url = `https://graphql.contentful.com/content/v1/spaces/${process.env.CTF_SPACE_ID}/environments/${environment}`;
    const body: BodyInit = await req.json();
    // "master" is the default value.
    const headers = {
        Authorization: `Bearer ${process.env.CTF_TOKEN}`,
        'Content-Type': 'application/json'
    };

    return vercelResponse(
        vercelRequest(url, {
            body: JSON.stringify(body),
            headers,
            method: 'post'
        })
    );
};

export const config = {
    runtime: 'experimental-edge'
};

export default contentfulGraphQl;
