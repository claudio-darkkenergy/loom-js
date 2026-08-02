import type { StorybookConfig } from '@storybook/html-vite';
import { join, dirname } from 'path';
import { mergeConfig } from 'vite';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, 'package.json')));
}
const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [
        getAbsolutePath('@storybook/addon-links'),
        getAbsolutePath('@chromatic-com/storybook')
    ],
    framework: {
        name: getAbsolutePath('@storybook/html-vite'),
        options: {}
    },
    docs: {},
    viteFinal(config, { configType }) {
        if (configType === 'DEVELOPMENT') {
            // Your development configuration goes here
        }

        if (configType === 'PRODUCTION') {
            // Your production configuration goes here.
        }

        return mergeConfig(config, {
            // Your environment configuration here
            esbuild: {
                keepNames: true
            }
        });
    }
};
export default config;
