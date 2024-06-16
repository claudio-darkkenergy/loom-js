import { PinkTag } from './pink-tag';
import {
    type Meta,
    RenderVariants,
    type RenderVariantsStoryArgs,
    type StoryObj
} from '@loom-js/storybook';

const meta: Meta<typeof RenderVariants> = {
    title: 'Elements/PinkTag',
    component: RenderVariants(PinkTag)
};

export default meta;

type Story = StoryObj<RenderVariantsStoryArgs>;

export const Variants: Story = {
    args: {
        itemProps: [
            {
                children: 'default',
                icon: 'icon-info'
            },
            {
                children: 'info',
                icon: 'icon-info',
                isInfo: true
            },
            {
                children: 'success',
                icon: 'icon-check-circle',
                isSuccess: true
            },
            {
                children: 'warning',
                icon: 'icon-exclamation',
                isWarning: true
            },
            {
                children: 'error',
                icon: 'icon-exclamation-circle',
                isDanger: true
            },
            {
                children: 'Beta',
                isEyebrowHeading: true
            }
        ]
    }
};
