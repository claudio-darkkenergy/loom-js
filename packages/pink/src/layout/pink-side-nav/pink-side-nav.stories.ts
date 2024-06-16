import { withIcon } from '../../modifiers';
import { PinkSideNav, type PinkSideNavProps } from './pink-side-nav';
import type { Meta, StoryObj } from '@loom-js/storybook';
import { Link } from '@loom-js/tags';

const { parameters } = (window as any).storybook;

const meta: Meta = {
    parameters: {
        decorator: parameters.decorator.flex.left()
    },
    component: PinkSideNav,
    argTypes: {
        bottom: {
            table: {
                disable: true
            }
        }
    }
};

export default meta;

type Story = StoryObj<PinkSideNavProps>;

export const Nav: Story = {
    args: {
        bottom: Link(
            withIcon({
                className: 'drop-button',
                children: 'Menu Item',
                href: '#',
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
