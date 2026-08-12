import { el } from '@loom-js/core';
import type { Meta, StoryObj } from '@loom-js/storybook';

import {
    PinkToggleButton,
    type PinkToggleButtonProps
} from './pink-toggle-button';

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
                children: el('span')({
                    className: 'tooltip-popup is-bottom is-center',
                    children: 'List View'
                }),
                className: 'tooltip',
                icon: 'icon-view-list'
            },
            {
                children: el('span')({
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
