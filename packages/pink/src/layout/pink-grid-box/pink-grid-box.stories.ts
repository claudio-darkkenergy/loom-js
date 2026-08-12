import { el } from '@loom-js/core';
import { ArgType, type Meta, type StoryObj } from '@loom-js/storybook';

import { PinkCard } from '../../elements/pink-card';
import { PinkGridBox, type PinkGridBoxProps } from './pink-grid-box';

const { parameters } = (window as any).storybook;

const meta: Meta<PinkGridBoxProps> = {
    title: 'Layout/PinkGridBox',
    parameters: {
        decorator: parameters.decorator.block.center()
    },
    component: PinkGridBox,
    argTypes: {
        children: ArgType.disable,
        is: ArgType.disable
    }
};

export default meta;

type Story = StoryObj<PinkGridBoxProps>;

// Authored items replace the retired `item`/`itemProps` render-prop API —
// fresh calls per story so no context is shared between them.
const buildCardItems = () =>
    Array(6)
        .fill(null)
        .map(() => el('li')({ children: PinkCard({ children: 'Card' }) }));

export const AutoColumns: Story = {
    args: {
        children: buildCardItems()
    }
};

export const ExactColumns: Story = {
    args: {
        children: buildCardItems(),
        cols: 3
    }
};
