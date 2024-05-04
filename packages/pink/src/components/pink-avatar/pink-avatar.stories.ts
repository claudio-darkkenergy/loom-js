import { PinkColor, PinkSize } from '../../types';
import { PinkAvatar, type PinkAvatarProps } from './pink-avatar';
import type { Meta, StoryObj } from '@loom-js/storybook';
import { Span } from '@loom-js/tags';

const meta: Meta = {
    title: 'Components/PinkAvatar',
    render: PinkAvatar,
    argTypes: {
        children: {
            table: {
                disable: true
            }
        },
        color: {
            type: 'select',
            options: [...Object.values(PinkColor)]
        },
        size: {
            type: 'select',
            options: Object.values(PinkSize)
        }
    },
    args: {
        color: PinkColor.Default,
        size: PinkSize.XLarge
    }
};

export default meta;

type Story = StoryObj<PinkAvatarProps>;

export const Empty: Story = {
    argTypes: {
        color: { control: false }
    },
    args: {
        color: PinkColor.Empty
    }
};

export const Text: Story = {
    args: {
        children: 'Pink',
        color: PinkColor.Pink
    }
};

export const Icon: Story = {
    args: {
        children: Span({ className: 'icon-code' })
    }
};

export const Image: Story = {
    argTypes: {
        alt: { table: { disable: true } }
    },
    args: {
        alt: 'Randomly chosen image related to technics',
        src: 'https://loremflickr.com/100/100/technics'
    }
};
