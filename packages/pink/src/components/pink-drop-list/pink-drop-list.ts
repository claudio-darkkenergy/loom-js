import { WithIconProps, withIcon } from '../../modifiers';
import type {
    ComponentOptionalProps,
    ComponentProps,
    SimpleComponent
} from '@loom-js/core';
import {
    Div,
    Link,
    type LinkProps,
    Section,
    type SectionProps,
    Ul,
    type UlProps
} from '@loom-js/tags';
import classNames from 'classnames';

export enum DropListArrow {
    Start = '',
    Center = 'center',
    End = 'end',
    NoArrow = 'no-arrow'
}

export type DropListItemProps = ComponentProps<
    LinkProps & WithIconProps & { isSelected?: boolean }
>;

interface DropListProps extends UlProps {
    arrow?: DropListArrow;
    isBlockEnd?: boolean;
    isInlineEnd?: boolean;
    itemProps?: DropListItemProps[];
}

const DropList: SimpleComponent<DropListProps> = ({
    className,
    itemProps,
    listItemProps,
    ...ulProps
}) =>
    Ul({
        ...ulProps,
        className: classNames(className, 'drop-list'),
        item: ({ className, isSelected, ...props }: DropListItemProps) =>
            Link(
                withIcon({
                    ...props,
                    className: classNames(className, 'drop-button', {
                        'is-selected': isSelected
                    })
                })
            ),
        itemProps,
        listItemProps: {
            ...listItemProps,
            className: classNames(listItemProps?.className, 'drop-list-item')
        }
    });

type DropSectionProps = SectionProps;

const DropSection: SimpleComponent<DropSectionProps> = ({
    className,
    ...props
}) =>
    Section({
        ...props,
        className: classNames(className, 'drop-section')
    });

export type PinkDropListProps = ComponentOptionalProps & DropListProps;

export const PinkDropList = (dropListProps: PinkDropListProps) =>
    Div({
        children: DropSection({ children: DropList(dropListProps) }),
        className: 'drop-list-wrapper'
    });

PinkDropList.List = DropList;
PinkDropList.Section = DropSection;
