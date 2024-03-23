import { component } from '@loom-js/core';

export const Table = component(
    (html, { children, className }) => html`
        <table class=${className}>
            <tbody>
                ${children}
            </tbody>
        </table>
    `
);
