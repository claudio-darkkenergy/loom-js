import { SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import { Div, Link, LinkProps, Section, Ul } from '@app/components/simple';

export const PinkSideNav: SimpleComponent = ({ className }) =>
    Div({
        children: [
            Div({
                children: Section({
                    children: Ul({
                        className: 'drop-list',
                        item: (props: LinkProps) =>
                            Link({ ...props, className: 'drop-button' }),
                        itemProps: [
                            {
                                className: 'isSelected',
                                children: 'Item 1'
                            },
                            { children: 'Item 2' }
                        ],
                        listItemProps: { className: 'drop-list-item' }
                    }),
                    className: 'drop-section'
                }),
                className: 'side-nav-main'
            }),
            Div({
                children: Section({
                    children: Link({
                        className: 'drop-button',
                        children: 'Menu Item',
                        href: ''
                    }),
                    className: 'drop-section'
                }),
                className: 'side-nav-bottom'
            })
        ],
        className: classNames(className, 'side-nav')
    });
