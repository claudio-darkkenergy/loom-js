import { component } from '@loom-js/core';

export interface ArticleProps {
    role?: string;
}

export const Article = component<ArticleProps>(
    (html, { children, className, role }) =>
        html`<article class=${className} role=${role}>${children}</article>`
);
