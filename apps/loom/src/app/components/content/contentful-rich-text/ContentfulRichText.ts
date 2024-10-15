import {
    ContentfulDocument,
    documentToComponents,
    Options
} from '@loom-js/contentful';
import {
    AttrsTemplateTagValue,
    component,
    TemplateTagValue
} from '@loom-js/core';
import { mergeAllowedAttrs } from '@loom-js/tags';

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
        console.log({ attrsOverrides, json });
        return html`
            <div $attrs=${attrsOverrides} $on=${on}>
                ${title} ${json && documentToComponents(json, options)}
            </div>
        `;
    }
);
