import { clientConfig } from './config.mjs';
import { build } from 'esbuild';

build(
    clientConfig({
        apiUrl: process.env.API_URL,
        ctfIsPreview: process.env.CTF_IS_PREVIEW !== 'false',
        isProd: process.env.NODE_ENV === 'production'
    })
);
