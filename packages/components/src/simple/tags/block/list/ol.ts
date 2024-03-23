import {
    type AttrsTemplateTagValue,
    component,
    type ComponentProps
} from '@loom-js/core';

import { mergeAllowedAttrs } from '../../../../helpers';

import { ListItems, type ListItemsProps } from './list-items';

export type OlProps = ListItemsProps & {
    listItemProps?: ComponentProps;
};

export const Ol = component<OlProps>(
    (
        html,
        {
            attrs,
            children,
            item,
            itemProps = [],
            listItemProps = {},
            on,
            ...listProps
        }
    ) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            listProps as unknown as AttrsTemplateTagValue
        );

        return html`
            <ol $attrs=${attrsOverrides} $on=${on}>
                ${children ||
                ListItems({
                    ...listItemProps,
                    item,
                    itemProps
                })}
            </ol>
        `;
    }
);
