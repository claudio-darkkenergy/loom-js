import { type Meta, type StoryObj } from '@loom-js/storybook';

import { PinkCopyButton, PinkCopyButtonProps } from './pink-copy-button';

const { parameters } = (globalThis as any).storybook;

const meta: Meta = {
    title: 'Elements/PinkCopyButton',
    component: PinkCopyButton,
    parameters: {
        decorator: parameters.decorator.block.left()
    }
};

export default meta;

type Story = StoryObj<PinkCopyButtonProps>;

export const Default: Story = {
    args: {
        text: 'Copied from the default button'
    }
};

export const Link: Story = {
    args: {
        buttonSize: '1.5rem',
        copiedLabel: 'Link copied!',
        icon: 'icon-link',
        label: 'Copy link',
        text: () => window.location.href
    }
};
