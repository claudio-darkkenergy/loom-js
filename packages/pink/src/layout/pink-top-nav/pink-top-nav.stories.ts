import { PinkTopNav, type PinkTopNavProps } from './pink-top-nav';
import type { Meta, StoryObj } from '@loom-js/storybook';

const { parameters } = (window as any).storybook;

const meta: Meta = {
    parameters: {
        decorator: parameters.decorator.flex.right()
    },
    component: PinkTopNav
};

export default meta;

type Story = StoryObj<PinkTopNavProps>;

export const Nav: Story = {
    args: {
        items: [
            {
                children: 'Item 1',
                href: '#'
            },
            {
                children: 'Item 2',
                href: '#'
            }
        ]
    }
};
