import { mergeAllowedAttrs } from '../../../../helpers';
import { ListItems, type ListItemsProps } from './list-items';
import {
    type AttrsTemplateTagValue,
    component,
    type ComponentProps
} from '@loom-js/core';

type RawOlProps = Pick<ListItemsProps, 'item' | 'itemProps'> & {
    listItemProps?: Omit<ListItemsProps, 'item' | 'itemProps'>;
};

export type OlProps = ComponentProps<RawOlProps>;

export const Ol = component<RawOlProps>(
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
            <ol $attrs=${attrsOverrides} $on=${on}>
                ${children || ListItems({ ...listItemProps, item, itemProps })}
            </ol>
        `;
    }
);
