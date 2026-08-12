import { el } from '@loom-js/core';
import { ArgType, type Meta, type StoryObj } from '@loom-js/storybook';

import { withIcon } from '../../modifiers';
import { PinkSideNav, type PinkSideNavProps } from './pink-side-nav';

const { parameters } = (globalThis as any).storybook;

const meta: Meta<PinkSideNavProps> = {
    title: 'Layout/PinkSideNav',
    parameters: {
        decorator: parameters.decorator.flex.left()
    },
    component: PinkSideNav,
    argTypes: {
        bottom: ArgType.disable
    }
};

export default meta;

type Story = StoryObj<PinkSideNavProps>;

export const Nav: Story = {
    args: {
        bottom: el('a')(
            withIcon({
                attrs: { href: '#' },
                className: 'drop-button',
                children: 'Menu Item',
                icon: 'icon-cog'
            })
        ),
        topLinkProps: [
            {
                children: 'Menu Item',
                href: '#',
                icon: 'icon-home',
                isSelected: true
            },
            { children: 'Menu Item', href: '#', icon: 'icon-user-group' },
            { children: 'Menu Item', href: '#', icon: 'icon-bell' },
            { children: 'Menu Item', href: '#', icon: 'icon-chart-pie' },
            { children: 'Menu Item', href: '#', icon: 'icon-document' }
        ]
    }
};
