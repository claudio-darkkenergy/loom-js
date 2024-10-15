import { mergeAllowedAttrs } from '../../../../helpers';
import { ListItems, type ListItemsProps } from './list-items';
import {
    type AttrsTemplateTagValue,
    component,
    type ComponentProps
} from '@loom-js/core';

type RawUlProps = Pick<ListItemsProps, 'item' | 'itemProps'> & {
    listItemProps?: Omit<ListItemsProps, 'item' | 'itemProps'>;
};

export type UlProps = ComponentProps<RawUlProps>;

export const Ul = component<RawUlProps>(
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
