import { build } from 'esbuild';

import { clientConfig } from './config.mjs';

build(
    clientConfig({
        apiUrl: process.env.API_URL,
        // Preview is an explicit opt-in — production must never default onto
        // Contentful's uncached Preview API.
        ctfIsPreview: process.env.CTF_IS_PREVIEW === 'true',
        isProd: process.env.NODE_ENV === 'production'
    })
);
