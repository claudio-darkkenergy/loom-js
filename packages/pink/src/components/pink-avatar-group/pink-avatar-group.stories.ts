import { PinkColor, PinkSize } from '../../types';
import type { PinkAvatarProps } from '../pink-avatar/pink-avatar';
import {
    PinkAvatarGroup,
    type PinkAvatarGroupProps
} from './pink-avatar-group';
import { ComponentProps } from '@loom-js/core';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta = {
    title: 'Components/PinkAvatar/PinkAvatarGroup',
    render: ({
        color,
        itemProps,
        size,
        ...args
    }: PinkAvatarGroupProps &
        ComponentProps<Pick<PinkAvatarProps, 'color' | 'size'>>) => {
        return PinkAvatarGroup({
            ...args,
            itemProps: (
                itemProps as ComponentProps<PinkAvatarProps>[] | undefined
            )?.map((props) => ({ color, size, ...props }))
        });
    },
    argTypes: {
        with3Char: 'boolean',
        withBorder: {
            type: 'boolean'
        }
    },
    args: {
        with3Char: false,
        withBorder: false
    }
};

export default meta;

type Story = StoryObj<PinkAvatarGroupProps>;

export const DivGroup: Story = {
    args: {
        itemProps: Object.values(PinkColor).map((color) => ({
            children: color,
            color
        })),
        size: PinkSize.Medium
    },
    argTypes: {
        size: {
            type: 'select',
            options: Object.values(PinkSize)
        }
    }
};

export const ImgGroup: Story = {
    args: {
        color: PinkColor.Default,
        itemProps: Object.values(PinkSize).map((size, i) => ({
            size,
            src: `https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/10${i}.jpg`
        }))
    },
    argTypes: {
        color: {
            type: 'select',
            options: [...Object.values(PinkColor)]
        }
    }
};
