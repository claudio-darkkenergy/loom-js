import {
    AttrsTemplateTagValue,
    component,
    TemplateTagValue
} from '@loom-js/core';

import { documentToComponents } from '@app/helpers/contentful/rich-text-renderer';
import {
    ContentfulDocument,
    Options
} from '@app/helpers/contentful/rich-text-renderer/types';
import { mergeAllowedAttrs } from '@app/helpers/loom-js';

export type { ContentfulDocument };

export interface ContentfulRichTextProps {
    json?: ContentfulDocument;
    options?: Options;
    title?: TemplateTagValue;
}

export const ContentfulRichText = component<ContentfulRichTextProps>(
    (html, { attrs, json, on, options, title, ...props }) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            props as unknown as AttrsTemplateTagValue
        );
        return html`
            <div $attrs=${attrsOverrides} $on=${on}>
                ${title} ${documentToComponents(json, options)}
            </div>
        `;
    }
);
