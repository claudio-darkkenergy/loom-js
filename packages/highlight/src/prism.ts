/// <reference path="./types/prism.d.ts" />
import { lazyImport } from '@loom-js/core';
import type Prism from 'prismjs';

import { type CodeToken, tokenizeCode } from './tokenize';

export type PrismInstance = typeof Prism;

// The tokenizer a UI library receives: pure text → tokens for a language.
export type Tokenize = (text: string, language: string) => CodeToken[];

const TOKENIZER_KEY = 'loom:highlight:tokenizer';

// Prism's grammar modules attach to the global `Prism` its core installs, so
// core must *evaluate* before them. Static imports can't promise that:
// bundlers with code splitting (esbuild) don't preserve side-effect import
// order inside a shared chunk. Sequential dynamic imports make the order a
// runtime guarantee — and through `lazyImport` the load is tracked by the
// settlement signal, so `renderToString` and `hydrate` wait for it.
const loadPrism = async (): Promise<PrismInstance> => {
    // Read by core before it evaluates: without it, core registers an
    // automatic document scan (spec: no global tokenizer side effects).
    const globalScope = globalThis as { Prism?: { manual?: boolean } };

    globalScope.Prism ??= { manual: true };
    globalScope.Prism.manual = true;

    const core = (await import('prismjs/components/prism-core')).default;

    await import('prismjs/components/prism-markup');
    await import('prismjs/components/prism-clike');
    await import('prismjs/components/prism-javascript');
    await import('prismjs/components/prism-typescript');
    await import('prismjs/components/prism-bash');

    return core;
};

/**
 * The tokenizer as a lazy-import activity: `undefined` until Prism and the
 * grammars have loaded, then a pure `Tokenize`. Cached per key for the life
 * of the page; the first consumer that asks starts the load. Hand it to a UI
 * library's code panel and render inside its `effect`.
 */
export const codeTokenizer = () =>
    lazyImport<Tokenize>(TOKENIZER_KEY, async () => {
        const prism = await loadPrism();

        return (text, language) => tokenizeCode(prism, text, language);
    });
