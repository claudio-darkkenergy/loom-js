import { PinkGridBox, type PinkGridBoxProps } from './pink-grid-box';
import type { Meta, StoryObj } from '@loom-js/storybook';
import { Div, Ul, type UlProps } from '@loom-js/tags';

const { parameters } = (window as any).storybook;

const meta: Meta<PinkGridBoxProps & UlProps> = {
    parameters: {
        decorator: parameters.decorator.block.center()
    },
    render: (({ itemProps, ...gridBoxProps }: PinkGridBoxProps & UlProps) =>
        PinkGridBox({
            ...gridBoxProps,
            is: Ul,
            item: Div,
            itemProps: itemProps?.map((props: any) => ({
                ...props,
                children: 'card',
                className: 'card'
            }))
        })) as (props: PinkGridBoxProps) => HTMLDivElement
};

export default meta;

type Story = StoryObj<PinkGridBoxProps>;

export const Parameters: Story = {
    argTypes: {
        itemProps: {
            table: {
                disable: true
            }
        }
    },
    args: {
        cols: 3,
        itemProps: Array(6).fill({})
    }
};
