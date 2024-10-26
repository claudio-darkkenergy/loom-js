import {
    type DropListItemProps,
    PinkDropList,
    type PinkDropListProps
} from '../../components/pink-drop-list';
import { PinkDynamicProps } from '../../types';
import type { SimpleComponent, TemplateTagValue } from '@loom-js/core';
import { Div, Nav, Section } from '@loom-js/tags';
import classNames from 'classnames';

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
    bottom?: TemplateTagValue | TemplateTagValue[];
    topLinkProps?: DropListItemProps[];
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
        : sideNavTop;

    return is({
        ...props,
        children: Div({
            children,
            className: 'side-nav-level-1'
        }),
        className: classNames(className, 'side-nav')
    });
};
