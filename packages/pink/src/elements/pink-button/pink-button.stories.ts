import { PinkButton } from './pink-button';
import {
    RenderVariants,
    type RenderVariantsStoryArgs,
    type Meta,
    type StoryObj
} from '@loom-js/storybook';

const meta: Meta = {
    title: 'Elements/PinkButton',
    component: RenderVariants(PinkButton, ({ itemProps }) => ({
        itemProps,
        style: { display: 'flex', gap: '30px' }
    }))
};

export default meta;

type Story = StoryObj<RenderVariantsStoryArgs>;

export const Types: Story = {
    args: {
        itemProps: [
            {
                children: 'Primary'
            },
            {
                children: 'Secondary',
                isSecondary: true
            },
            {
                children: 'Text',
                isText: true
            },
            {
                icon: 'icon-plus',
                isOnlyIcon: true
            },
            {
                icon: 'icon-x',
                isOnlyIcon: true,
                isText: true
            }
        ]
    }
};

export const Sizes: Story = {
    args: {
        itemProps: [
            {
                children: 'Medium'
            },
            {
                children: 'Large',
                isBig: true
            }
        ]
    }
};

export const ButtonsWithIcons: Story = {
    args: {
        itemProps: [
            {
                children: 'Button',
                icon: 'icon-plus',
                isSecondary: true
            },
            {
                children: 'Button',
                icon: 'icon-cheveron-left',
                isSecondary: true
            },
            {
                appendIcon: true,
                children: 'Button',
                icon: 'icon-cheveron-right',
                isSecondary: true
            },
            {
                children: 'Button',
                icon: 'icon-trash',
                isSecondary: true
            },
            {
                children: 'Button',
                icon: 'icon-duplicate',
                isSecondary: true
            },
            {
                children: 'Button',
                icon: 'icon-download',
                isSecondary: true
            },
            {
                children: 'Button',
                icon: 'icon-external-link',
                isSecondary: true
            }
        ]
    }
};
