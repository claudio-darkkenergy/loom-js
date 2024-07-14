import { join, dirname } from 'path';

import type { StorybookConfig } from '@storybook/html-vite';
import { mergeConfig } from 'vite';
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
        getAbsolutePath('@storybook/addon-essentials'),
        getAbsolutePath('@chromatic-com/storybook'),
        getAbsolutePath('@storybook/addon-interactions')
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
