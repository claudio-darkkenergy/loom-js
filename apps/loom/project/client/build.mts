import { build } from 'esbuild';

import { clientConfig } from './config.mjs';

build(
    clientConfig({
        apiUrl: process.env.API_URL,
        // Preview is an explicit opt-in — production must never default onto
        // Contentful's uncached Preview API.
        ctfIsPreview: process.env.CTF_IS_PREVIEW === 'true',
        // build.mts is the production entry (dev.mts serves dev) — don't
        // depend on ambient NODE_ENV, which CI build environments may not set.
        isProd: process.env.NODE_ENV !== 'development'
    })
);
