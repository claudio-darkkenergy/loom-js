import * as path from 'path';
import Router from '@koa/router';
import Koa from 'koa';
import sendfile from 'koa-sendfile';
import serve from 'koa-static';

export interface SsrServerOptions {
    assetPath?: string;
    filename?: string;
    inputPath?: string;
    port?: number | string;
    routes?: string[];
}

const defaultPath = path.join(process.cwd(), 'build');

export const ssrServer = async ({
    assetPath = defaultPath,
    filename = 'index.html',
    inputPath = defaultPath,
    port = process.env.PORT || 8080,
    routes = ['/']
}: SsrServerOptions) => {
    const router = new Router();
    const app = new Koa();
    let server: ReturnType<typeof app.listen>;

    routes.forEach((route) => {
        router.get(route, async (ctx) => {
            await sendfile(ctx, path.join(inputPath, filename));

            if (!ctx.status) {
                ctx.throw(404);
            }
        });
    });

    /* Middleware */

    app.use(
        serve(
            assetPath.indexOf(inputPath) >= 0
                ? assetPath
                : path.join(inputPath, assetPath)
        )
    );
    app.use(router.routes());

    return new Promise<typeof server>((resolve) => {
        // Start the server.
        server = app.listen(port, () => {
            console.info(` | Ready on http://localhost:${port}`);
            resolve(server);
        });
    });
};
