import { withIcon } from '../../modifiers';
import type { SimpleComponent } from '@loom-js/core';
import {
    Button,
    type ButtonProps,
    Div,
    type DivProps,
    Link,
    type LinkProps,
    Span,
    Ul,
    type UlProps
} from '@loom-js/tags';
import classNames from 'classnames';

enum TabsButtonScrollPlacement {
    Start = 'start',
    End = 'end'
}

type TabsButtonScrollProps = ButtonProps & {
    placement: TabsButtonScrollPlacement;
};

const TabsButtonScroll = ({
    placement,
    style,
    ...buttonProps
}: TabsButtonScrollProps) =>
    Button(
        withIcon({
            ...buttonProps,
            aria: { label: `Show items at ${placement} side` },
            className: classNames('tabs-button-scroll', `is-${placement}`),
            icon: `icon-cheveron-${placement === TabsButtonScrollPlacement.Start ? 'left' : 'right'}`,
            iconProps: {
                style: { 'pointer-events': 'all' }
            },
            key: placement,
            style: [style, { 'pointer-events': 'none' }].flat()
        })
    );

export type LinkItemProps = LinkProps & { isSelected?: boolean };

export type PinkTabsProps = DivProps & {
    hideControls?: boolean;
    tabsListProps?: Omit<UlProps, 'item'> & {
        itemProps?: LinkItemProps[];
    };
};

export const PinkTabs: SimpleComponent<PinkTabsProps> = ({
    className,
    tabsListProps,
    hideControls = false,
    ...props
}) => {
    const TabsList = Ul({
        className: 'tabs-list',
        item: ({
            children,
            className: linkClassName,
            isSelected,
            ...linkProps
        }: LinkItemProps) =>
            Link({
                ...linkProps,
                children: Span({
                    children,
                    className: 'text'
                }),
                className: classNames(linkClassName, 'tabs-button', {
                    'is-selected': isSelected
                })
            }),
        itemProps: tabsListProps?.itemProps,
        key: 'tabs-list',
        listItemProps: {
            ...tabsListProps?.listItemProps,
            className: classNames(
                tabsListProps?.listItemProps?.className,
                'tabs-item'
            )
        }
    });

    return Div({
        ...props,
        children: hideControls
            ? TabsList
            : [
                  TabsButtonScroll({
                      placement: TabsButtonScrollPlacement.Start
                  }),
                  TabsButtonScroll({
                      placement: TabsButtonScrollPlacement.End
                  }),
                  TabsList
              ],
        className: classNames(className, 'tabs')
    });
};
