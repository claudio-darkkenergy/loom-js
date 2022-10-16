import {
    Component,
    MouseEventListener,
    PlainObject,
    TemplateTagValue
} from '@loom-js/core';

import { Li, LiProps } from '@app/component/simple';

export interface ListItemsProps {
    listItem?: Component<PlainObject>;
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
