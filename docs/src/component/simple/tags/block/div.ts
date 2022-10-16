import { component } from '@loom-js/core';

export interface DivProps {
    role?: string;
}

export const Div = component<DivProps>(
    (html, { children, className, role }) =>
        html`<div class=${className} role=${role}>${children}</div>`
);
