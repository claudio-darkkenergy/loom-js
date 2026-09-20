// jsdom entry of the DOM-implementation matrix — same scenarios as the
// linkedom run (support/render-suite.mjs), against a spec-stricter
// implementation. Its own file because the template cache allows one DOM
// implementation per process; node's test runner isolates files.
import { JSDOM } from 'jsdom';

import { defineRenderSuite } from './support/render-suite.mjs';

const createWindow = () =>
    new JSDOM('<!doctype html><html><head></head><body></body></html>').window;

defineRenderSuite('jsdom', createWindow);
