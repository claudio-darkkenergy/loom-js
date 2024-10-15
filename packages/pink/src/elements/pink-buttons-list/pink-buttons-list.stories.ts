import {
    PinkButtonsList,
    type PinkButtonsListProps
} from './pink-buttons-list';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta<PinkButtonsListProps> = {
    title: 'Elements/PinkButtonsList',
    component: PinkButtonsList
};

export default meta;

type Story = StoryObj<PinkButtonsListProps>;

export const ButtonsList: Story = {
    args: {
        itemProps: Array(4)
            .fill(0)
            .map((_, i) => ({
                children: `Button ${i + 1}`,
                isText: true
            }))
    }
};
