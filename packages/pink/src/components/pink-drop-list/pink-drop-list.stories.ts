import { Meta, StoryObj } from '@loom-js/storybook';

import { PinkDropList, type PinkDropListProps } from './pink-drop-list';

const meta: Meta = {
    title: 'Components/PinkDropList',
    component: PinkDropList
};

export default meta;

type Story = StoryObj<PinkDropListProps>;

export const Main: Story = {};
