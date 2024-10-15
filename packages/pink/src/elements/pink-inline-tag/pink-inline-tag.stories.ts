import { PinkButton } from '../pink-button';
import { PinkInlineTag, type PinkInlineTagProps } from './pink-inline-tag';
import type { SimpleComponent, ComponentProps } from '@loom-js/core';
import {
    type Meta,
    type StoryObj,
    RenderVariants,
    type RenderVariantsStoryArgs,
    ArgType
} from '@loom-js/storybook';
import { Span } from '@loom-js/tags';

const meta: Meta<PinkInlineTagProps> = {
    title: 'Elements/PinkInlineTag',
    component: PinkInlineTag
};

export default meta;

type Story = StoryObj<ComponentProps<PinkInlineTagProps>>;

export const InlineTag: Story = {
    args: {
        children: 4,
        isDisabled: false,
        isInfo: false
    }
};

export const ColorState: Story = {
    args: {
        children: 2,
        isInfo: true
    }
};

export const DisabledState: Story = {
    args: {
        children: 2,
        isDisabled: true
    }
};

const PinkButtonWithInlineTag: SimpleComponent<PinkInlineTagProps> = (props) =>
    PinkButton({
        ...props,
        children: [
            Span({
                className: 'text',
                children: 'button'
            }),
            PinkInlineTag({
                children: 4
            })
        ]
    });

type UsageWithButtonsStory = StoryObj<RenderVariantsStoryArgs>;

export const UsageWithButtons: UsageWithButtonsStory = {
    render: (props: any) => RenderVariants(PinkButtonWithInlineTag)(props),
    args: {
        itemProps: [
            {
                isSecondary: true
            },
            {
                disabled: true,
                isSecondary: true
            },
            {
                isText: true
            },
            {
                disabled: true,
                isText: true
            }
        ]
    },
    argTypes: {
        itemProps: ArgType.disable
    }
};
