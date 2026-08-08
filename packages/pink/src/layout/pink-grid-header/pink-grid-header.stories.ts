import type { Meta, StoryObj } from '@loom-js/storybook';
import { Div, H2, Span } from '@loom-js/tags';

import { PinkToggleButton } from '../../components/pink-toggle-button/index.js';
import { PinkButton } from '../../elements/pink-button/index.js';
import { PinkInlineTag } from '../../elements/pink-inline-tag/index.js';
import {
    PinkGridHeader,
    type PinkGridHeaderProps
} from './pink-grid-header.js';

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
        slots: {
            col1: H2({
                children: 'Databases',
                className:
                    'heading-level-5 u-trim-1 u-cross-child-center grid-header-col-1'
            }),
            col2: PinkButton({
                children: 'Create Database',
                className: 'grid-header-col-2',
                icon: 'icon-plus'
            }),
            col3: PinkToggleButton({
                buttonProps: [
                    {
                        icon: 'icon-view-list',
                        isSelected: true
                    },
                    {
                        icon: 'icon-view-grid'
                    }
                ],
                className: 'grid-header-col-3'
            }),
            col4: Div({
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
                className: 'drop-wrapper grid-header-col-4'
            })
        }
    }
};
