import {
    component,
    el,
    type ComponentInputProps,
    simple,
    type TemplateTagValue
} from '@loom-js/core';
import classNames from 'classnames';

import {
    type DropListItemProps,
    PinkDropList,
    type PinkDropListProps
} from '../../components/pink-drop-list';
import { PinkDynamicProps } from '../../types';

const SideNavBottom = component<ComponentInputProps>(
    (html, { children }) => html`
        <div class="side-nav-bottom">
            <section class="drop-section">${children}</section>
        </div>
    `
);

interface SideNavTopProps {
    listProps: PinkDropListProps;
}

const SideNavTop = component<ComponentInputProps<SideNavTopProps>>(
    (html, { listProps }) => html`
        <div class="side-nav-main">
            <section>${PinkDropList(listProps)}</section>
        </div>
    `
);

export type PinkSideNavProps = PinkDynamicProps & {
    bottom?: TemplateTagValue;
    topLinkProps?: ComponentInputProps<DropListItemProps>[];
};

// Pure delegation at the root (`is`); the inner level-1 wrapper travels as
// a value.
export const PinkSideNav = simple<ComponentInputProps<PinkSideNavProps>>(
    ({ bottom, className, is = el('nav'), topLinkProps, ...props }) => {
        const sideNavTop = SideNavTop({
            listProps: {
                itemProps: topLinkProps
            }
        });
        const children = bottom
            ? [
                  sideNavTop,
                  SideNavBottom({
                      children: bottom
                  })
              ]
            : (sideNavTop as TemplateTagValue);

        return is({
            ...props,
            children: el('div')({
                children,
                className: 'side-nav-level-1'
            }),
            className: classNames(className, 'side-nav')
        });
    }
);
