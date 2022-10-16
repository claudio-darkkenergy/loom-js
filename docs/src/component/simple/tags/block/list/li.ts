import { component, MouseEventListener } from '@loom-js/core';

export interface LiProps {
    onClick?: MouseEventListener;
}

export const Li = component<LiProps>(
    (html, { children, className, onClick }) =>
        html`<li $click=${onClick} class=${className}>${children}</li>`
);
