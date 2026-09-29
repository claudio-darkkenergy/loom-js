import { build } from 'esbuild';

import { clientConfig } from './config.mjs';

build(
    clientConfig({
        apiUrl: process.env.API_URL,
        isProd: process.env.NODE_ENV === 'production'
    })
);
