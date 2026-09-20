// Happy DOM entry of the DOM-implementation matrix — same scenarios as the
// linkedom run (support/render-suite.mjs). Happy DOM validates attribute
// names spec-correctly, which is exactly what this run adds to the matrix.
// Its own file because the template cache allows one DOM implementation per
// process; node's test runner isolates files.
import { Window } from 'happy-dom';

import { defineRenderSuite } from './support/render-suite.mjs';

const createWindow = () => new Window();

defineRenderSuite('happy-dom', createWindow);
