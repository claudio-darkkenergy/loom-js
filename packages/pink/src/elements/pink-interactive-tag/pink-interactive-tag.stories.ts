import {
    type Meta,
    RenderVariants,
    type StoryObj,
    type RenderVariantsStoryProps
} from '@loom-js/storybook';

import {
    PinkInteractiveTag,
    type PinkInteractiveTagProps
} from './pink-interactive-tag';

const meta: Meta<PinkInteractiveTagProps> = {
    title: 'Elements/PinkInteractiveTag',
    component: RenderVariants(PinkInteractiveTag)
};

export default meta;

type Story = StoryObj<RenderVariantsStoryProps<PinkInteractiveTagProps>>;

const staticItemProps = {
    children: 'interactive',
    icon: 'icon-duplicate'
};

export const InteractiveTag: Story = {
    args: {
        itemProps: [
            staticItemProps,
            {
                ...staticItemProps,
                href: '#',
                isSelected: true
            },
            {
                ...staticItemProps,
                disabled: true
            }
        ]
    }
};
