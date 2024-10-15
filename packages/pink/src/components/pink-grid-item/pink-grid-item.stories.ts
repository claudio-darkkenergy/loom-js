import { PinkGridItem, type PinkGridItemProps } from './pink-grid-item';
import { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta<typeof PinkGridItem> = {
    title: 'Components/PinkGridItem',
    component: PinkGridItem
};

export default meta;

export const Main: StoryObj<PinkGridItemProps> = {
    args: {
        topLeft: 'Top Left',
        topRight: 'Top Right',
        bottomLeft: 'Bottom Left',
        bottomRight: 'Bottom Right'
    }
};
