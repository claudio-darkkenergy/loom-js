import {
    simple,
    type ComponentInputProps,
    type TemplateTagValue
} from '@loom-js/core';
import {
    DropListItemProps,
    PinkCollapsible,
    PinkDropList
} from '@loom-js/pink';
import classNames from 'classnames';

import styles from './NavGroup.module.css';

export interface NavGroupProps {
    /** Overrides the derived open state (open when a link is selected). */
    isOpen?: boolean;
    itemProps?: ComponentInputProps<DropListItemProps>[];
    title?: TemplateTagValue;
}

/**
 * One collapsible link group inside a nav drop list: a list item wrapping
 * a native-disclosure collapsible whose content is the group's links,
 * indented under the group label. Opens when one of its links is selected,
 * unless `isOpen` says otherwise.
 */
export const NavGroup = simple<ComponentInputProps<NavGroupProps>>(
    ({ isOpen, itemProps = [], title }) =>
        PinkDropList.Item({
            children: PinkCollapsible({
                buttonProps: { className: 'u-small' },
                children: PinkDropList.List({
                    itemProps: itemProps.map((linkItemProps) => ({
                        ...linkItemProps,
                        className: classNames(
                            linkItemProps.className,
                            styles.groupLink
                        )
                    }))
                }),
                isOpen:
                    isOpen ?? itemProps.some(({ isSelected }) => isSelected),
                title
            }),
            className: 'drop-list-item'
        })
);
