import { PinkColor, PinkSize } from '../../types';
import type { PinkAvatarProps } from '../pink-avatar/pink-avatar';
import {
    PinkAvatarGroup,
    type PinkAvatarGroupProps
} from './pink-avatar-group';
import { ComponentProps } from '@loom-js/core';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta = {
    title: 'Components/PinkAvatarGroup',
    render: ({
        color,
        itemProps,
        size,
        ...args
    }: PinkAvatarGroupProps & ComponentProps<StoryExtraArgs>) => {
        return PinkAvatarGroup({
            ...args,
            itemProps: (
                itemProps as ComponentProps<PinkAvatarProps>[] | undefined
            )?.map((props) => ({ color, size, ...props }))
        }) as HTMLDivElement;
    },
    argTypes: {
        with3Char: 'boolean'
    },
    args: {
        with3Char: false
    }
};

export default meta;

type Story = StoryObj<PinkAvatarGroupProps & StoryExtraArgs>;
type StoryExtraArgs = { color?: PinkColor; size?: PinkSize };

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
            alt: `avatar/10${i}`,
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
