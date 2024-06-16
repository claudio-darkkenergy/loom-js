import { PinkBoxes, type PinkBoxesProps } from './pink-boxes';
import type { Meta, StoryObj } from '@loom-js/storybook';

const meta: Meta<typeof PinkBoxes> = {
    title: 'Elements/PinkBoxes',
    render: ({ boxProps, ...boxesProps }: PinkBoxesProps) =>
        PinkBoxes({
            ...boxesProps,
            boxProps: boxProps.map((props) => ({
                ...props,
                className: 'u-flex u-gap-16 u-cross-center'
            }))
        })
};

export default meta;

type Story = StoryObj<typeof PinkBoxes>;

export const Boxes: Story = {
    args: {
        boxProps: [
            {
                children: 'Top Box'
            },
            {
                children: 'Middle Box'
            },
            {
                children: 'Middle Box'
            },
            {
                children: 'Bottom Box'
            }
        ]
    }
};
