import type { ComponentProps } from '@loom-js/core';
import type { Meta, StoryObj } from '@loom-js/storybook';

import { PinkBox, type PinkBoxProps } from './pink-box';

const meta: Meta = {
    title: 'Elements/PinkBox',
    component: PinkBox
};

export default meta;

type Story = StoryObj<ComponentProps<PinkBoxProps>>;

export const Box: Story = {
    args: {
        children: 'Box element'
    }
};
