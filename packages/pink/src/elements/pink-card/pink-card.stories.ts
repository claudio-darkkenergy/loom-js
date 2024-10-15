import { PinkCard, type PinkCardProps } from './pink-card';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta<typeof PinkCard> = {
    title: 'Elements/PinkCard',
    component: PinkCard
};

export default meta;

export const Main: StoryObj<PinkCardProps> = {
    args: {
        children: 'PinkCard',
        isBorderDashed: false,
        isAllowFocus: true
    }
};
