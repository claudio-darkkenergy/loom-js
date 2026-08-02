import { init } from '@loom-js/core';

import { App } from './app.js';

const title = 'Hello Loom!';
console.log({ title });

init({
    app: App({ title }),
    root: document.body
});
