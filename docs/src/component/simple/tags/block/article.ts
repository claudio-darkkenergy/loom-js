import { component } from '@loomjs/core';

export interface ArticleProps {
    role?: string;
}

export const Article = component<ArticleProps>(
    (html, { children, className, role }) =>
        html`<article class=${className} role=${role}>${children}</article>`
);
