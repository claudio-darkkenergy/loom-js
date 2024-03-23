import { component, type TemplateTagValue } from '@loom-js/core';

export interface AsideProps {
    content: TemplateTagValue;
}

export const Aside = component<AsideProps>(
    (html, { content }) => html`<aside>${content}</aside>`
);
