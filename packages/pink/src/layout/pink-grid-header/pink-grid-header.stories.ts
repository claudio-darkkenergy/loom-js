import { PinkToggleButton } from '../../components/pink-toggle-button/index.js';
import { PinkButton } from '../../elements/pink-button/index.js';
import { PinkInlineTag } from '../../elements/pink-inline-tag/index.js';
import {
    PinkGridHeader,
    type PinkGridHeaderProps
} from './pink-grid-header.js';
import type { Meta, StoryObj } from '@loom-js/storybook';
import { Span } from '@loom-js/tags';

const { parameters } = (window as any).storybook;

const meta: Meta<PinkGridHeaderProps> = {
    title: 'Layout/PinkGridHeader',
    parameters: {
        decorator: parameters.decorator.block.left()
    },
    component: PinkGridHeader
};

export default meta;

type Story = StoryObj<PinkGridHeaderProps>;

export const Example: Story = {
    args: {
        gridCol1: {
            children: 'Databases',
            className: 'heading-level-5 u-trim-1 u-cross-child-center'
        },
        gridCol2: {
            is: PinkButton,
            children: 'Create Database',
            icon: 'icon-plus'
        },
        gridCol3: {
            is: PinkToggleButton,
            buttonProps: [
                {
                    icon: 'icon-view-list',
                    isSelected: true
                },
                {
                    icon: 'icon-view-grid'
                }
            ]
        },
        gridCol4: {
            children: PinkButton({
                children: [
                    Span({
                        children: 'Columns',
                        className: 'is-only-desktop'
                    }),
                    PinkInlineTag({
                        children: 4
                    })
                ],
                icon: 'icon-view-boards',
                iconProps: { className: 'u-opacity-50' },
                isSecondary: true
            }),
            className: 'drop-wrapper'
        }
    }
};
