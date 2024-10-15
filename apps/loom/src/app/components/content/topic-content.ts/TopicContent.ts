import { StyledRichText } from '../styled-rich-text/StyledRichText';
import { ContentfulDocument } from '@loom-js/contentful';
import { component } from '@loom-js/core';
import { H1 } from '@loom-js/tags';

export type TopicContentProps = {
    title?: Node;
    json?: ContentfulDocument;
};

export const TopicContent = component<TopicContentProps>(
    (html, { className, json, title }) => html`
        <div class=${className}>
            ${title &&
            H1({
                children: title,
                className: 'heading-level-3',
                style: 'color: hsl(var(--brand-color-2))'
            })}
            ${json && StyledRichText({ json })}
        </div>
    `
);
