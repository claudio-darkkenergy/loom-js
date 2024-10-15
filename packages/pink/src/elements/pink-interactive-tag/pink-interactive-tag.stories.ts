import {
    PinkInteractiveTag,
    type PinkInteractiveTagProps
} from './pink-interactive-tag';
import {
    type Meta,
    RenderVariants,
    type StoryObj,
    type RenderVariantsStoryArgs
} from '@loom-js/storybook';

const meta: Meta<PinkInteractiveTagProps> = {
    title: 'Elements/PinkInteractiveTag',
    component: RenderVariants(PinkInteractiveTag, ({ itemProps }) => ({
        itemProps: itemProps?.map((props: object) => ({
            children: 'interactive',
            icon: 'icon-duplicate',
            ...props
        }))
    }))
};

export default meta;

type Story = StoryObj<RenderVariantsStoryArgs>;

export const InteractiveTag: Story = {
    args: {
        itemProps: [
            {},
            {
                href: '#',
                isSelected: true
            },
            {
                disabled: true
            }
        ]
    }
};
