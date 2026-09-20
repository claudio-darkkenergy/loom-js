// Server-rendering tests (`renderToStringSync`, the synchronous render
// primitive, + off-browser import safety). The async `renderToString` — the
// go-to for route-table apps — is covered in route-rendering.test.mjs.
//
// These run in Node — deliberately outside any browser — against the built
// `dist/` entries, because that absence of browser globals is half of what is
// under test (and linkedom's CJS dependencies cannot be served into the
// browser-based wtr suite). Run via `pnpm test-server`, which builds first.
//
// The render scenarios live in support/render-suite.mjs, parameterized by
// window factory: this file is the linkedom entry of the DOM-implementation
// matrix (see render-to-string.jsdom.test.mjs / .happy-dom.test.mjs).
import { parseHTML } from 'linkedom';
import { describe, it } from 'node:test';

import { defineRenderSuite } from './support/render-suite.mjs';
import assert from 'node:assert/strict';

const createWindow = () =>
    parseHTML('<!doctype html><html><head></head><body></body></html>').window;

defineRenderSuite('linkedom', createWindow);

describe('server entry packaging', () => {
    it('is consumable as CommonJS too', async () => {
        const { createRequire } = await import('node:module');
        const require = createRequire(import.meta.url);
        const cjs = require('../../dist/server.js');

        assert.equal(typeof cjs.renderToString, 'function');
        assert.equal(typeof cjs.renderToStringSync, 'function');
    });
});
