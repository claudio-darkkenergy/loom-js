import { PinkLoader, type PinkLoaderProps } from './pink-loader';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta<PinkLoaderProps> = {
    title: 'Elements/PinkLoader',
    component: PinkLoader
};

export default meta;

export const Main: StoryObj<PinkLoaderProps> = {
    args: {
        isLoading: true,
        isSmall: false,
        isTransparent: false,
        percent: 50
    },
    argTypes: {
        isLoading: { control: 'boolean' },
        isSmall: { control: 'boolean' },
        isTransparent: { control: 'boolean' },
        percent: { control: 'number' }
    }
};
