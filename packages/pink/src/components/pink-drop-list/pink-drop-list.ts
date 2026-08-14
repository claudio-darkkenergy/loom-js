import { component, el, type ComponentInputProps, simple } from '@loom-js/core';
import classNames from 'classnames';

import { WithIconProps, withIcon } from '../../modifiers';

export enum DropListArrow {
    Start = '',
    Center = 'center',
    End = 'end',
    NoArrow = 'no-arrow'
}

export type DropListItemProps = WithIconProps & {
    href?: string;
    isSelected?: boolean;
    target?: '_blank' | '_self';
};

interface DropListProps {
    arrow?: DropListArrow;
    isBlockEnd?: boolean;
    isInlineEnd?: boolean;
    itemProps?: ComponentInputProps<DropListItemProps>[];
    listItemProps?: ComponentInputProps;
}

const DropListItem = component<ComponentInputProps>(
    (html, { attrs, children, className, id, on, onClick, style }) => html`
        <li
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${className}
            id=${id}
            style=${style}
        >
            ${children}
        </li>
    `
);

const DropList = component<ComponentInputProps<DropListProps>>(
    (
        html,
        {
            attrs,
            children,
            className,
            id,
            itemProps,
            listItemProps,
            on,
            onClick,
            style
        }
    ) => html`
        <ul
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'drop-list')}
            id=${id}
            style=${style}
        >
            ${
                children ||
                itemProps?.map(
                    ({
                        attrs: itemAttrs,
                        className: itemClassName,
                        href,
                        isSelected,
                        target,
                        ...props
                    }) =>
                        DropListItem({
                            ...listItemProps,
                            children: el('a')(
                                withIcon({
                                    ...props,
                                    attrs: {
                                        ...itemAttrs,
                                        ...(href === undefined ? {} : { href }),
                                        target: target ?? '_self'
                                    },
                                    className: classNames(
                                        itemClassName,
                                        'drop-button',
                                        {
                                            'is-selected': isSelected
                                        }
                                    )
                                })
                            ),
                            className: classNames(
                                listItemProps?.className,
                                'drop-list-item'
                            )
                        })
                )
            }
        </ul>
    `
);

const DropSection = simple<ComponentInputProps<{ role?: string }>>(
    ({ attrs, className, role, ...props }) =>
        el('section')({
            ...props,
            attrs: {
                ...attrs,
                ...(role ? { role } : {})
            },
            className: classNames(className, 'drop-section')
        })
);

export type PinkDropListProps = ComponentInputProps<DropListProps>;

const DropListWrapper = component<PinkDropListProps>(
    (html, props) => html`
        <div class="drop-list-wrapper">
            ${DropSection({ children: DropList(props) })}
        </div>
    `
);

export const PinkDropList = Object.assign(DropListWrapper, {
    List: DropList,
    Section: DropSection
});
