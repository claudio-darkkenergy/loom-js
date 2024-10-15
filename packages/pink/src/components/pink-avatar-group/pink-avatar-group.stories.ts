import { PinkColor, PinkSize } from '../../types';
import { PinkAvatar } from '../pink-avatar/pink-avatar';
import {
    PinkAvatarGroup,
    type PinkAvatarGroupProps
} from './pink-avatar-group';
import type { GetProps } from '@loom-js/core';
import { ArgType, type Meta, type StoryObj } from '@loom-js/storybook';

const meta: Meta<PinkAvatarGroupProps & StoryExtraArgs> = {
    title: 'Components/PinkAvatarGroup',
    render: ({ color, itemProps, size, ...args }) =>
        PinkAvatarGroup({
            ...args,
            itemProps: itemProps?.map((props: GetProps<typeof PinkAvatar>) => ({
                color,
                size,
                ...props
            }))
        }),
    argTypes: {
        itemProps: ArgType.disable,
        size: {
            control: 'select',
            options: Object.values(PinkSize)
        }
    }
};

export default meta;

type Story = StoryObj<PinkAvatarGroupProps & StoryExtraArgs>;
type StoryExtraArgs = { color?: PinkColor | string; size?: PinkSize };

export const Sizes: Story = {
    args: {
        itemProps: Object.values(PinkColor).map((color) => ({
            children: 'AA',
            color,
            isWith3Char: false
        })),
        size: PinkSize.Medium
    }
};

export const Images: Story = {
    args: {
        color: PinkColor.Default,
        itemProps: Object.values(PinkSize).map((size, i) => ({
            alt: `avatar/10${i}`,
            size,
            src: `https://loremflickr.com/100/100?random=${i}`
        }))
    },
    argTypes: {
        color: {
            control: 'select',
            options: Object.values(PinkColor)
        },
        size: {
            control: false
        }
    }
};

export const ThreeCharacterOption: Story = {
    args: {
        itemProps: Object.values(PinkColor)
            .slice(0, 4)
            .map((color, i, itemPropsArr) => {
                const isLast = i === itemPropsArr.length - 1;
                return {
                    children: isLast ? '+12' : 'AA',
                    color: isLast ? PinkColor.Default : color,
                    isWith3Char: isLast ? true : false
                };
            }),
        size: PinkSize.Medium
    }
};
