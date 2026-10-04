import { ContentfulDocument } from '@loom-js/contentful';
import { component, el } from '@loom-js/core';

import { StyledRichText } from '../styled-rich-text/StyledRichText';
import { useFragmentSync } from '@/app/logic/hooks/use-fragment-sync';

export type TopicContentProps = {
    title?: Node;
    json?: ContentfulDocument;
};

export const TopicContent = component<TopicContentProps>(
    (html, { className, json, onMounted, onRendered, onUnmounted, title }) => {
        // The topic view owns the anchored headings, so it hosts the spy.
        useFragmentSync({ onMounted, onRendered, onUnmounted });

        return html`
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
        `;
    }
);
