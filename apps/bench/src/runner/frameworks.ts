// The framework registry: what to build, how, and where its version lives.
import type { Plugin } from 'esbuild';
import { solidPlugin } from 'esbuild-plugin-solid';
import sveltePlugin from 'esbuild-svelte';

import type { FrameworkId } from '../types.ts';
import { vuePlugin } from './vue-plugin.ts';

export interface FrameworkSpec {
    id: FrameworkId;
    name: string;
    /** The browser entry, relative to the bench workspace root. */
    entry: string;
    /** The installed package whose `version` is reported; `null` for vanilla. */
    versionPackage: string | null;
    plugins: Plugin[];
    /** esbuild `jsx` settings, for the JSX frameworks. */
    jsx?: { jsx: 'automatic' | 'preserve'; jsxImportSource?: string };
}

export const FRAMEWORKS: FrameworkSpec[] = [
    {
        id: 'vanilla',
        name: 'Vanilla JS',
        entry: 'src/apps/vanilla/index.ts',
        versionPackage: null,
        plugins: []
    },
    {
        id: 'loom',
        name: 'Loom',
        entry: 'src/apps/loom/index.ts',
        versionPackage: '@loom-js/core',
        plugins: []
    },
    {
        id: 'react',
        name: 'React',
        entry: 'src/apps/react/index.tsx',
        versionPackage: 'react',
        plugins: [],
        jsx: { jsx: 'automatic' }
    },
    {
        id: 'vue',
        name: 'Vue 3',
        entry: 'src/apps/vue/index.ts',
        versionPackage: 'vue',
        plugins: [vuePlugin()]
    },
    {
        id: 'svelte',
        name: 'Svelte 5',
        entry: 'src/apps/svelte/index.ts',
        versionPackage: 'svelte',
        plugins: [sveltePlugin({ compilerOptions: { css: 'injected' } })]
    },
    {
        id: 'solid',
        name: 'Solid',
        entry: 'src/apps/solid/index.tsx',
        versionPackage: 'solid-js',
        plugins: [solidPlugin()]
    }
];
