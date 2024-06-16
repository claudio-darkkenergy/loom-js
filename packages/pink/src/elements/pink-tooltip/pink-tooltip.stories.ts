import { PinkTooltip } from './pink-tooltip';
import {
    type Meta,
    type StoryObj,
    RenderVariants,
    type RenderVariantsStoryArgs
} from '@loom-js/storybook';
import { Paragraph } from '@loom-js/tags';

const meta: Meta = {
    title: 'Elements/PinkTooltip',
    component: RenderVariants(PinkTooltip)
};

export default meta;

const popupMessage = 'Set variables or secret keys.';

type Story = StoryObj<RenderVariantsStoryArgs>;

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
                popupMessage: Paragraph({
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
