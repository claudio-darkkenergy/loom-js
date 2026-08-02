import { build } from 'esbuild';

import { clientConfig } from './config.mjs';

build(clientConfig({ isProd: process.env.NODE_ENV === 'production' }));
