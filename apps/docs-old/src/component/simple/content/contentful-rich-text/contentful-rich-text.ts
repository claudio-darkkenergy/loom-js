import { component, TemplateTagValue } from '@loom-js/core';

import { documentToComponents } from '@app/helpers/contentful/rich-text-renderer';
import {
    ContentfulDocument,
    Options
} from '@app/helpers/contentful/rich-text-renderer/types';

export type { ContentfulDocument };

export interface ContentfulRichTextProps {
    json?: ContentfulDocument;
    options?: Options;
    title?: TemplateTagValue;
}

export const ContentfulRichText = component<ContentfulRichTextProps>(
    (html, { className, json, options, title }) => html`
        <div class=${className}>
            ${title} ${documentToComponents(json, options)}
        </div>
    `
);
