import {
    PinkToggleButton,
    type PinkToggleButtonProps
} from './pink-toggle-button';
import type { Meta, StoryObj } from '@loom-js/storybook';
import { Span } from '@loom-js/tags';

const meta: Meta<PinkToggleButtonProps> = {
    title: 'Components/PinkToggleButton',
    render: PinkToggleButton
};

export default meta;

type Story = StoryObj<PinkToggleButtonProps>;

export const Parameters: Story = {
    args: {
        buttonProps: [
            {
                icon: 'icon-view-list'
            },
            {
                icon: 'icon-view-grid',
                isSelected: true
            }
        ]
    }
};

export const States: Story = {
    args: {
        buttonProps: [
            {
                disabled: true,
                icon: 'icon-view-list'
            },
            {
                disabled: true,
                icon: 'icon-view-grid',
                isSelected: true
            }
        ]
    }
};

export const IconToggleWithTooltip: Story = {
    args: {
        buttonProps: [
            {
                children: Span({
                    className: 'tooltip-popup is-bottom is-center',
                    children: 'List View'
                }),
                className: 'tooltip',
                icon: 'icon-view-list'
            },
            {
                children: Span({
                    className: 'tooltip-popup is-bottom is-center',
                    children: 'Grid View'
                }),
                className: 'tooltip',
                icon: 'icon-view-grid',
                isSelected: true
            }
        ]
    }
};
