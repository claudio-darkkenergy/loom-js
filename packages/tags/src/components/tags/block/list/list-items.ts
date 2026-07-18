import { Span } from '../../inline';
import { Li, type LiProps } from './li';
import type {
    Component,
    ComponentInputProps,
    SimpleComponent
} from '@loom-js/core';

export type ListItemsProps = LiProps & {
    item?: Component | SimpleComponent;
    itemProps?: ComponentInputProps[];
};

export const ListItems: SimpleComponent<ListItemsProps> = ({
    item = Span,
    itemProps = [],
    ...listItemProps
}) =>
    itemProps.map((props) =>
        Li({
            ...listItemProps,
            children: item(props)
        })
    );
