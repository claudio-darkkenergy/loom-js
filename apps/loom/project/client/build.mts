import { clientConfig } from './config.mjs';
import { build } from 'esbuild';

build(
    clientConfig({
        apiUrl: process.env.API_URL,
        isProd: process.env.NODE_ENV === 'production'
    })
);
