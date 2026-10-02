// A static file server for the built pages — module scripts need http, not
// file://. Binds an ephemeral port; the caller closes it.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import path from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8'
};

export interface StaticServer {
    origin: string;
    close: () => Promise<void>;
}

export const serveStatic = (rootDir: string): Promise<StaticServer> =>
    new Promise((resolve, reject) => {
        const server: Server = createServer(async (request, response) => {
            const pathname = new URL(request.url ?? '/', 'http://bench.local')
                .pathname;
            const filePath = path.join(rootDir, path.normalize(pathname));

            if (!filePath.startsWith(rootDir)) {
                response.writeHead(403).end();

                return;
            }

            // Chrome asks for one on every page; a 404 would count as a page error.
            if (pathname === '/favicon.ico') {
                response.writeHead(204).end();

                return;
            }

            try {
                await stat(filePath);
                response.writeHead(200, {
                    'Cache-Control': 'no-store',
                    'Content-Type':
                        CONTENT_TYPES[path.extname(filePath)] ??
                        'application/octet-stream'
                });
                createReadStream(filePath).pipe(response);
            } catch {
                response.writeHead(404).end();
            }
        });

        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();

            if (!address || typeof address === 'string') {
                reject(new Error('[bench] static server did not bind a port.'));

                return;
            }

            resolve({
                origin: `http://127.0.0.1:${address.port}`,
                close: () =>
                    new Promise((done, fail) =>
                        server.close((error) => (error ? fail(error) : done()))
                    )
            });
        });
    });
