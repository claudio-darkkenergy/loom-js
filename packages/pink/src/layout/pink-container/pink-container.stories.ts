import { el } from '@loom-js/core';
import { ArgType, type Meta, type StoryObj } from '@loom-js/storybook';

import { PinkContainer, type PinkContainerProps } from './pink-container';

const meta: Meta<PinkContainerProps> = {
    title: 'Layout/PinkContainer',
    component: PinkContainer,
    argTypes: {
        children: ArgType.disable
    }
};

export default meta;

type Story = StoryObj<PinkContainerProps>;

export const Main: Story = {
    args: {
        children: el('p')({
            className: 'text',
            children: 'Container'
        })
    }
};
