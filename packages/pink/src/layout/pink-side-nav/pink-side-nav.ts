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
    PinkDropList
} from '../../components/pink-drop-list';
import { PinkDynamicProps } from '../../types';

const SideNavBottom = component<ComponentInputProps>(
    (html, { children }) => html`
        <div class="side-nav-bottom">
            <section class="drop-section">${children}</section>
        </div>
    `
);

const SideNavTop = component<ComponentInputProps>(
    (html, { children }) => html`
        <div class="side-nav-main">${children}</div>
    `
);

export type PinkSideNavProps = PinkDynamicProps & {
    bottom?: TemplateTagValue;
    /**
     * Arbitrary main-area content — e.g. multiple labelled sections. Takes
     * precedence over `topLinkProps`, which renders a single flat list.
     */
    top?: TemplateTagValue;
    topLinkProps?: ComponentInputProps<DropListItemProps>[];
};

// Pure delegation at the root (`is`); the inner level-1 wrapper travels as
// a value.
export const PinkSideNav = simple<ComponentInputProps<PinkSideNavProps>>(
    ({ bottom, className, is = el('nav'), top, topLinkProps, ...props }) => {
        const sideNavTop = SideNavTop({
            children:
                top ??
                el('section')({
                    children: PinkDropList({ itemProps: topLinkProps })
                })
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
