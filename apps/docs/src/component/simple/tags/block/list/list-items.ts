import {
    Component,
    ContextFunction,
    MouseEventListener,
    // PlainObject,
    TemplateTagValue
} from '@loom-js/core';

import { Li, LiProps } from '@app/component/simple';

export interface ListItemsProps {
    listItem?: (props: any) => ContextFunction | Component;
    listProps?: (LiProps | TemplateTagValue)[];
    onItemClick?: MouseEventListener;
}

export const ListItems = ({
    listItem,
    listProps = [],
    onItemClick
}: ListItemsProps) =>
    listProps.map((props) =>
        Li({
            children: listItem ? listItem(props) : (props as TemplateTagValue),
            onClick: onItemClick
        })
    );
