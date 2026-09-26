import { el, simple, type ComponentInputProps } from '@loom-js/core';
import { DropListItemProps, PinkDropList } from '@loom-js/pink';
import classNames from 'classnames';

import { NavGroup, type NavGroupProps } from '../nav-group';

export interface NavGroupListProps {
    sections?: NavGroupProps[];
}

// A flat (ungrouped) link renders as a plain drop-list item. Icon support
// stays with pink's DropList — these links are label-only.
const flatLinkItem = ({
    href,
    isSelected,
    target,
    className,
    ...linkProps
}: ComponentInputProps<DropListItemProps>) =>
    PinkDropList.Item({
        children: el('a')({
            ...linkProps,
            attrs: {
                ...(href === undefined ? {} : { href }),
                target: target ?? '_self'
            },
            className: classNames(className, 'drop-button', {
                'is-selected': isSelected
            })
        }),
        className: 'drop-list-item'
    });

/**
 * A nav drop list mixing flat links and collapsible groups: an untitled
 * section's links render directly; a titled section renders as a
 * `NavGroup` collapsible.
 */
export const NavGroupList = simple<ComponentInputProps<NavGroupListProps>>(
    ({ sections = [] }) =>
        PinkDropList({
            children: sections.flatMap(({ itemProps = [], title, isOpen }) =>
                title
                    ? NavGroup({ isOpen, itemProps, title })
                    : itemProps.map(flatLinkItem)
            )
        })
);
