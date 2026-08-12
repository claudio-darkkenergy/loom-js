import {
    component,
    el,
    type ComponentInputProps,
    type SimpleComponent
} from '@loom-js/core';
import classNames from 'classnames';

import { withIcon } from '../../modifiers';

enum TabsButtonScrollPlacement {
    Start = 'start',
    End = 'end'
}

// Delegator over el('button') — the children come from withIcon.
const TabsButtonScroll: SimpleComponent<
    ComponentInputProps<{ placement: TabsButtonScrollPlacement }>
> = ({ attrs, placement, style, ...buttonProps }) =>
    el('button')(
        withIcon({
            ...buttonProps,
            attrs: {
                ...attrs,
                'aria-label': `Show items at ${placement} side`,
                type: 'button'
            },
            className: classNames('tabs-button-scroll', `is-${placement}`),
            icon: `icon-cheveron-${placement === TabsButtonScrollPlacement.Start ? 'left' : 'right'}`,
            iconProps: {
                style: { 'pointer-events': 'all' }
            },
            key: placement,
            style: [style, { 'pointer-events': 'none' }].flat()
        })
    );

export type LinkItemProps = ComponentInputProps<{
    href?: string;
    isSelected?: boolean;
    target?: '_blank' | '_self';
}>;

type TabsItemProps = LinkItemProps & {
    liProps?: ComponentInputProps;
};

const TabsItem = component<TabsItemProps>(
    (
        html,
        {
            attrs,
            children,
            className,
            href,
            id,
            isSelected,
            liProps,
            on,
            onClick,
            style,
            target
        }
    ) => html`
        <li
            $attrs=${liProps?.attrs}
            $click=${liProps?.onClick}
            $on=${liProps?.on}
            class=${liProps?.className}
            id=${liProps?.id}
            style=${liProps?.style}
        >
            <a
                $attrs=${attrs}
                $click=${onClick}
                $on=${on}
                class=${classNames(className, 'tabs-button', {
                    'is-selected': isSelected
                })}
                href=${href}
                id=${id}
                style=${style}
                target=${target ?? '_self'}
            >
                <span class="text">${children}</span>
            </a>
        </li>
    `
);

export type PinkTabsProps = ComponentInputProps<{
    hideControls?: boolean;
    tabsListProps?: ComponentInputProps<{
        itemProps?: LinkItemProps[];
        listItemProps?: ComponentInputProps;
    }>;
}>;

export const PinkTabs = component<PinkTabsProps>(
    (
        html,
        {
            attrs,
            className,
            hideControls = false,
            id,
            on,
            onClick,
            style,
            tabsListProps
        }
    ) => html`
        <div
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'tabs')}
            id=${id}
            style=${style}
        >
            ${
                hideControls
                    ? undefined
                    : [
                          TabsButtonScroll({
                              placement: TabsButtonScrollPlacement.Start
                          }),
                          TabsButtonScroll({
                              placement: TabsButtonScrollPlacement.End
                          })
                      ]
            }
            <ul class="tabs-list">
                ${tabsListProps?.itemProps?.map((itemProps) =>
                    TabsItem({
                        ...itemProps,
                        liProps: {
                            ...tabsListProps?.listItemProps,
                            className: classNames(
                                tabsListProps?.listItemProps?.className,
                                'tabs-item'
                            )
                        }
                    })
                )}
            </ul>
        </div>
    `
);
