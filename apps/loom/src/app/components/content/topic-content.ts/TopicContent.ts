import { ContentfulDocument } from '@loom-js/contentful';
import { component, el } from '@loom-js/core';

import { StyledRichText } from '../styled-rich-text/StyledRichText';

export type TopicContentProps = {
    title?: Node;
    json?: ContentfulDocument;
};

export const TopicContent = component<TopicContentProps>(
    (html, { className, json, title }) => html`
        <div class=${className}>
            ${
                title &&
                el('h1')({
                    children: title,
                    className: 'heading-level-3',
                    style: 'color: hsl(var(--brand-color-2))'
                })
            }
            ${json && StyledRichText({ json })}
        </div>
    `
);
