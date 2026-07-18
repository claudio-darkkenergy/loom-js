import { mergeAllowedAttrs } from '../../../../helpers';
import { ListItems, type ListItemsProps } from './list-items';
import { type AttrsTemplateTagValue, component } from '@loom-js/core';

export type UlProps = Pick<ListItemsProps, 'item' | 'itemProps'> & {
    listItemProps?: Omit<ListItemsProps, 'item' | 'itemProps'>;
};

export const Ul = component<UlProps>(
    (
        html,
        {
            attrs,
            children,
            item,
            itemProps,
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
            <ul $attrs=${attrsOverrides} $on=${on}>
                ${children || ListItems({ ...listItemProps, item, itemProps })}
            </ul>
        `;
    }
);
