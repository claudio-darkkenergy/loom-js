import { component } from '@loomjs/core';

export const Table = component(
    (html, { children, className }) => html`
        <table class=${className}>
            <tbody>
                ${children}
            </tbody>
        </table>
    `
);
