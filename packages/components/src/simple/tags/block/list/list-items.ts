import type {
    Component,
    MouseEventListener,
    TemplateTagValue
} from '@loom-js/core';

import { Li, LiProps } from '@loom-js/components/simple';

export interface ListItemsProps {
    listItem?: Component;
    listProps: (LiProps | TemplateTagValue)[];
    onItemClick?: MouseEventListener;
}

export const ListItems = ({
    listItem,
    listProps,
    onItemClick
}: ListItemsProps) =>
    listProps.map((props) =>
        Li({
            children: listItem
                ? listItem(props as LiProps)
                : (props as TemplateTagValue),
            onClick: onItemClick
        })
    );
