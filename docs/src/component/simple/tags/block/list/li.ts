import { component, MouseEventListener } from '@loomjs/core';

export interface LiProps {
    onClick?: MouseEventListener;
}

export const Li = component<LiProps>(
    (html, { children, className, onClick }) =>
        html`<li $click=${onClick} class=${className}>${children}</li>`
);
