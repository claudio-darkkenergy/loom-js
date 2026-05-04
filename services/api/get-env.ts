import { VercelRequest, VercelResponse } from '@vercel/node';

export function GET(req: VercelRequest, res: VercelResponse) {
    try {
        console.log({ method: req.method });
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const env = { VERCEL_URL: process.env.VERCEL_URL };
        console.log({ env });
        res.status(200).setHeader('Access-Control-Allow-Origin', '*').json(env);
    } catch (error) {
        console.error({ error });
        res.status(500)
            .setHeader('Access-Control-Allow-Origin', '*')
            .json({ error });
    }
}
