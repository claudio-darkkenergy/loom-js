import { component } from '@loom-js/core';

import { ListItems, ListItemsProps } from './list-items';

export type UlProps = ListItemsProps;

export const Ul = component<UlProps>(
    (html, { className, listItem, listProps = [], onItemClick }) => html`
        <ul class=${className}>
            ${ListItems({
                listItem,
                listProps,
                onItemClick
            })}
        </ul>
    `
);
