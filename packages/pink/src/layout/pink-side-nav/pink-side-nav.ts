import type {
    ComponentInputProps,
    SimpleComponent,
    TemplateTagValue
} from '@loom-js/core';
import { Div, Nav, Section } from '@loom-js/tags';
import classNames from 'classnames';

import {
    type DropListItemProps,
    PinkDropList,
    type PinkDropListProps
} from '../../components/pink-drop-list';
import { PinkDynamicProps } from '../../types';

const SideNavBottom: SimpleComponent = ({ children }) =>
    Div({
        children: Section({
            children,
            className: 'drop-section'
        }),
        className: 'side-nav-bottom'
    });

interface SideNavTopProps {
    listProps: PinkDropListProps;
}

const SideNavTop: SimpleComponent<SideNavTopProps> = ({ listProps }) =>
    Div({
        children: Section({
            children: PinkDropList(listProps)
        }),
        className: 'side-nav-main'
    });

export type PinkSideNavProps = PinkDynamicProps & {
    // mainButtonProps: any[];
    bottom?: TemplateTagValue;
    topLinkProps?: ComponentInputProps<DropListItemProps>[];
};

export const PinkSideNav: SimpleComponent<PinkSideNavProps> = ({
    bottom,
    className,
    is = Nav,
    topLinkProps,
    ...props
}) => {
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
        children: Div({
            children,
            className: 'side-nav-level-1'
        }),
        className: classNames(className, 'side-nav')
    });
};
