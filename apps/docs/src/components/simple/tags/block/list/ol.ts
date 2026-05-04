import { ListItems } from './list-items';
import { mergeAllowedAttrs } from '@app/helpers/loom-js';
import {
    type AttrsTemplateTagValue,
    component,
    type GetProps
} from '@loom-js/core';

export type OlProps = {
    listItemProps?: GetProps<typeof ListItems>;
};

export const Ol = component<OlProps>(
    (html, { attrs, children, listItemProps = {}, on, ...listProps }) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            listProps as unknown as AttrsTemplateTagValue
        );

        return html`
            <ol $attrs=${attrsOverrides} $on=${on}>
                ${children || ListItems(listItemProps)}
            </ol>
        `;
    }
);
