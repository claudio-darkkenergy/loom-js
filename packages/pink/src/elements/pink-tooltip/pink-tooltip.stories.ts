import { el } from '@loom-js/core';
import { type Meta, type StoryObj, RenderVariants } from '@loom-js/storybook';

import { PinkTooltip, type PinkTooltipProps } from './pink-tooltip';

const meta: Meta<PinkTooltipProps> = {
    title: 'Elements/PinkTooltip',
    component: RenderVariants(PinkTooltip)
};

export default meta;

const popupMessage = 'Set variables or secret keys.';

type Story = StoryObj<PinkTooltipProps>;

export const Variants: Story = {
    args: {
        itemProps: [
            {
                icon: 'icon-info',
                popupMessage
            },
            {
                children: 'User ID',
                icon: 'icon-duplicate',
                isTag: true,
                popupMessage: el('p')({
                    children: popupMessage,
                    className: 'text u-margin-block-start-8'
                })
            },
            {
                children: 'User ID',
                icon: 'icon-duplicate',
                isBottom: true,
                isTag: true,
                popupMessage
            },
            {
                children: 'User ID',
                icon: 'icon-duplicate',
                isEnd: true,
                isTag: true,
                popupMessage
            }
        ]
    }
};
