export function GET() {
    return new Response(`Hello from ${process.env.VERCEL_REGION}`);
}

export const config = {
    runtime: 'edge'
};
