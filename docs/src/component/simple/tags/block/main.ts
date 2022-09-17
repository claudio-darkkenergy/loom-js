import { component } from '@loomjs/core';

export const Main = component(
    (html, { className, children }) =>
        html` <main class=${className}>${children}</main> `
);
