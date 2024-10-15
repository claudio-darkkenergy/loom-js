import { PinkCard } from '../../elements/pink-card';
import { PinkGridBox, type PinkGridBoxProps } from './pink-grid-box';
import { ArgType, type Meta, type StoryObj } from '@loom-js/storybook';
import { Ul } from '@loom-js/tags';

const { parameters } = (window as any).storybook;

const meta: Meta<PinkGridBoxProps> = {
    title: 'Layout/PinkGridBox',
    parameters: {
        decorator: parameters.decorator.block.center()
    },
    component: PinkGridBox,
    argTypes: {
        is: ArgType.disable,
        item: ArgType.disable,
        itemProps: ArgType.disable
    }
};

export default meta;

type Story = StoryObj<PinkGridBoxProps>;

const storyBaseArgs = {
    is: Ul,
    item: PinkCard,
    itemProps: Array(6).fill({
        children: 'Card'
    })
};

export const AutoColumns: Story = {
    args: {
        ...storyBaseArgs
    }
};

export const ExactColumns: Story = {
    args: {
        ...storyBaseArgs,
        cols: 3
    }
};
