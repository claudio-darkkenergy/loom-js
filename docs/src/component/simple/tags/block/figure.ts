import { component, TemplateTagValue } from '@loomjs/core';

export interface FigureProps {
    caption?: TemplateTagValue;
}

export const Figure = component<FigureProps>(
    (html, { caption, children, className }) => html`
        <figure class="${className}">
            ${children}
            <figcaption>${caption}</figcaption>
        </figure>
    `
);
