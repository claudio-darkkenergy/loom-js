// A minimal `.vue` loader over `vue/compiler-sfc`: `<script setup>` +
// `<template>` compile to one module with an optimized render function —
// the output a vite build would produce, without the vite dependency.
import type { Plugin } from 'esbuild';
import { compileScript, compileTemplate, parse } from 'vue/compiler-sfc';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const vuePlugin = (): Plugin => ({
    name: 'bench-vue-sfc',
    setup(build) {
        build.onLoad({ filter: /\.vue$/ }, async ({ path: filePath }) => {
            const source = await readFile(filePath, 'utf8');
            const { descriptor, errors } = parse(source, {
                filename: filePath
            });

            if (errors.length) {
                return {
                    errors: errors.map((error) => ({ text: error.message }))
                };
            }

            if (descriptor.styles.length) {
                return {
                    errors: [
                        {
                            text: 'bench SFCs take their styles from the shared stylesheet, not a <style> block.'
                        }
                    ]
                };
            }

            const id = path.basename(filePath, '.vue');
            const script = compileScript(descriptor, {
                id,
                inlineTemplate: true,
                templateOptions: { compilerOptions: { mode: 'module' } }
            });

            // `inlineTemplate` folds the render function into the setup
            // return, so only the script output ships; a template-only SFC
            // would need `compileTemplate` — kept reachable for that case.
            const contents =
                descriptor.template && !descriptor.scriptSetup
                    ? `${script.content}\n${compileTemplate({ filename: filePath, id, source: descriptor.template.content }).code}`
                    : script.content;

            return {
                contents,
                loader: script.lang === 'ts' ? 'ts' : 'js',
                resolveDir: path.dirname(filePath)
            };
        });
    }
});
