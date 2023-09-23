import { component } from '@loom-js/core';

export const Main = component(
    (html, { className, children }) =>
        html` <main class=${className}>${children}</main> `
);
