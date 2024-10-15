import { PinkContainer, type PinkContainerProps } from './pink-container';
import { ArgType, type Meta, type StoryObj } from '@loom-js/storybook';
import { Paragraph } from '@loom-js/tags';

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
        children: Paragraph({
            className: 'text',
            children: 'Container'
        })
    }
};
