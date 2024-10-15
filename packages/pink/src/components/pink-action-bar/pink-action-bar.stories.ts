import { PinkActionBar, type PinkActionBarProps } from './pink-action-bar';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta<typeof PinkActionBar> = {
    title: 'Elements/PinkActionBar',
    component: PinkActionBar
};

export default meta;

export const Main: StoryObj<PinkActionBarProps> = {
    args: {
        startContent: {
            className: 'u-gap-8',
            children: 'Start Content'
        },
        endContent: {
            className: 'u-gap-8',
            children: 'End Content'
        }
    }
};
