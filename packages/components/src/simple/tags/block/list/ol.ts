import { component } from '@loom-js/core';

import { ListItems, ListItemsProps } from './list-items';

export type OlProps = ListItemsProps;

export const Ol = component<OlProps>(
    (html, { className, listItem, listProps = [], onItemClick }) => html`
        <ol class=${className}>
            ${ListItems({
                listItem,
                listProps,
                onItemClick
            })}
        </ol>
    `
);
