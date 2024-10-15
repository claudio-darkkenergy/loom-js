import { Span } from '../../inline';
import { Li, type LiProps } from './li';
import type {
    Component,
    ComponentProps,
    GetProps,
    SimpleComponent
} from '@loom-js/core';

type RawListItemsProps = LiProps & {
    item?: Component | SimpleComponent;
    itemProps?: ComponentProps[];
};

export type ListItemsProps = GetProps<typeof ListItems>;

export const ListItems: SimpleComponent<RawListItemsProps> = ({
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
