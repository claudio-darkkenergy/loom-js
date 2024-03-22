import { clientConfig } from './config.mjs';
import { build } from 'esbuild';

build(clientConfig({ isProd: process.env.NODE_ENV === 'production' }));
