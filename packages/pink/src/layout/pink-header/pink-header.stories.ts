import { PinkToggleButton } from '../../components/pink-toggle-button';
import { PinkButton } from '../../elements/pink-button';
import { PinkInlineTag } from '../../elements/pink-inline-tag';
import {
    PinkHeader,
    type PinkHeaderProps,
    type PinkHeaderColsProp
} from './pink-header';
import type { Meta, StoryObj } from '@loom-js/storybook';
import { Div, H2, Span } from '@loom-js/tags';

const { parameters } = (window as any).storybook;

const meta: Meta<PinkHeaderProps> = {
    parameters: {
        decorator: parameters.decorator.block.left()
    },
    render: (({ ...props }: PinkHeaderProps) =>
        PinkHeader({
            ...props,
            children: (({
                gridCol1,
                gridCol2,
                gridCol3,
                gridCol4
            }: PinkHeaderColsProp) => [
                gridCol1,
                Div({
                    children: [gridCol4, gridCol3, gridCol2],
                    className: 'u-flex u-gap-16 u-contents-mobile'
                })
            ]) as any
        })) as (props: PinkHeaderProps) => HTMLDivElement
};

export default meta;

type Story = StoryObj<PinkHeaderProps>;

export const Example: Story = {
    args: {
        gridCol1: {
            item: H2,
            props: {
                children: 'Databases',
                className: 'heading-level-5 u-trim-1 u-cross-child-center'
            }
        },
        gridCol2: {
            item: PinkButton,
            props: {
                children: 'Create Database',
                icon: 'icon-plus'
            }
        },
        gridCol3: {
            item: PinkToggleButton,
            props: {
                buttonProps: [
                    {
                        icon: 'icon-view-list',
                        isSelected: true
                    },
                    {
                        icon: 'icon-view-grid'
                    }
                ]
            }
        },
        gridCol4: {
            item: Div,
            props: {
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
                    iconClassName: 'u-opacity-50',
                    isSecondary: true
                }),
                className: 'drop-wrapper'
            }
        }
    }
};
