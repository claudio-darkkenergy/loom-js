import { el, type TemplateTagValue } from '@loom-js/core';
import { type Meta, type StoryObj } from '@loom-js/storybook';

import { PinkSideNav } from '../../layout/pink-side-nav';
import { PinkDropList } from '../pink-drop-list';
import { PinkCollapsible, type PinkCollapsibleProps } from './pink-collapsible';

const { parameters } = (globalThis as any).storybook;

// A pinned inline-size keeps the story box stable when opening an item
// with wider content (a shrink-wrapped flex center would grow with it).
const pinnedDecorator = (inlineSize: string) => ({
    ...parameters.decorator.block.left(),
    style: {
        'inline-size': `min(${inlineSize}, 100%)`,
        'margin-inline': 'auto'
    }
});

const meta: Meta<PinkCollapsibleProps> = {
    title: 'Components/PinkCollapsible',
    component: PinkCollapsible,
    parameters: {
        decorator: pinnedDecorator('40rem')
    }
};

export default meta;

type Story = StoryObj<PinkCollapsibleProps>;

const BLURB =
    'Collapsibles are used to display a vertical list of headers that ' +
    'reveal or hide content. They allow to progressively disclose ' +
    'information as desired.';

const blurb = () =>
    el('p')({ children: BLURB, className: 'text u-margin-block-start-8' });

// The single-item convenience form (args-driven).
export const Single: Story = {
    args: {
        children: blurb(),
        isOpen: true,
        optionalLabel: '(optional)',
        title: 'Options one'
    }
};

// Docs "Complete example": three stacked items in one collapsible list.
const accordionItem = (title: TemplateTagValue) =>
    PinkCollapsible.Item({
        buttonProps: {
            children: el('span')({ children: title, className: 'text' }),
            optionalLabel: '(optional)'
        },
        children: blurb()
    });

export const Accordion: Story = {
    render: () =>
        PinkCollapsible.List({
            children: ['Options one', 'Options two', 'Option three'].map(
                accordionItem
            ),
            className: 'u-width-full-line'
        })
};

// Docs "Collapsible w/ Checkboxes": checkbox + tag headers, a form list in
// the open item's content, and a disabled trailing item.
const checkboxButtonProps = (isDisabled = false) => ({
    children: [
        el('input')({
            attrs: { disabled: isDisabled, type: 'checkbox' },
            className: 'is-small'
        }),
        el('span')({
            children: 'Advanced Options',
            className: `body-text-2 u-bold${isDisabled ? ' u-color-text-disabled' : ''}`
        }),
        el('span')({
            children: '2',
            className: `inline-tag${isDisabled ? ' is-disabled' : ''}`
        })
    ],
    iconClassName: isDisabled ? 'u-color-text-disabled' : undefined
});

const choiceItem = (isChecked: boolean) =>
    el('li')({
        children: el('label')({
            children: [
                el('input')({
                    attrs: { checked: isChecked, type: 'checkbox' },
                    className: 'is-small'
                }),
                el('div')({
                    children: [
                        el('div')({
                            children: 'Subheading',
                            className: 'choice-item-title'
                        }),
                        el('p')({
                            children:
                                'A clear description of what will happen if you select this option',
                            className: 'choice-item-paragraph'
                        })
                    ],
                    className: 'choice-item-content'
                })
            ],
            className: 'choice-item'
        }),
        className: 'form-item'
    });

export const WithCheckboxes: Story = {
    render: () =>
        PinkCollapsible.List({
            children: [
                PinkCollapsible.Item({
                    buttonProps: checkboxButtonProps(),
                    children: el('div')({
                        children: el('ul')({
                            children: [true, false, true].map(choiceItem),
                            className: 'form-list'
                        }),
                        className: 'form'
                    }),
                    contentProps: {
                        className: 'u-margin-block-start-8 u-padding-inline-32'
                    },
                    isOpen: true
                }),
                PinkCollapsible.Item({
                    buttonProps: {
                        ...checkboxButtonProps(),
                        optionalLabel: '(optional)'
                    },
                    children: blurb()
                }),
                PinkCollapsible.Item({
                    buttonProps: checkboxButtonProps(true),
                    children: blurb(),
                    isDisabled: true
                })
            ],
            className: 'u-width-full-line'
        })
};

// Docs "Disabled Item".
export const DisabledItem: Story = {
    render: () =>
        PinkCollapsible.List({
            children: PinkCollapsible.Item({
                buttonProps: checkboxButtonProps(true),
                contentProps: {
                    className: 'u-margin-block-start-8 u-padding-inline-32'
                },
                isDisabled: true
            }),
            className: 'u-width-full-line'
        })
};

// Docs "Collapsible w/ info items": avatar-led headers inside a card.
const infoItem = () =>
    PinkCollapsible.Item({
        buttonProps: {
            children: [
                el('div')({
                    children: el('span')({
                        attrs: { 'aria-hidden': true },
                        className: 'icon-question-mark-circle'
                    }),
                    className: 'avatar is-size-small'
                }),
                el('span')({
                    children: 'Advanced Options',
                    className: 'body-text-2 u-bold'
                })
            ],
            className: 'u-gap-16'
        },
        children: blurb(),
        className: 'is-info',
        contentProps: {
            className:
                'u-padding-inline-start-48 u-padding-inline-end-32 u-margin-inline-start-2'
        }
    });

export const InfoItems: Story = {
    render: () =>
        el('div')({
            children: PinkCollapsible.List({
                children: [infoItem(), infoItem(), infoItem()],
                className: 'u-width-full-line'
            }),
            className: 'card u-width-full-line'
        })
};

// The loom docs side-nav use-case: collapsible link groups composed into a
// drop list beside flat links, the selected link's group open.
const navTopic = (label: TemplateTagValue, isSelected = false) => ({
    children: el('span')({
        children: label,
        className: 'u-margin-inline-start-16'
    }),
    href: '#',
    isSelected
});

const navGroup = (
    title: TemplateTagValue,
    topics: ReturnType<typeof navTopic>[],
    isOpen = false
) =>
    PinkDropList.Item({
        children: PinkCollapsible({
            buttonProps: { className: 'u-small' },
            children: PinkDropList.List({ itemProps: topics }),
            isOpen,
            title
        }),
        className: 'drop-list-item'
    });

export const SideNavGroups: Story = {
    // Side-nav width, not the accordion width.
    parameters: {
        decorator: pinnedDecorator('18rem')
    },
    // Wrapped in `PinkSideNav` — `.side-nav` context resets the
    // collapsible-wrapper padding, as in the real nav.
    render: () =>
        PinkSideNav({
            top: el('section')({
                children: PinkDropList({
                    children: [
                        PinkDropList.Item({
                            children: el('a')({
                                attrs: { href: '#' },
                                children: 'Home',
                                className: 'drop-button'
                            }),
                            className: 'drop-list-item'
                        }),
                        navGroup(
                            'Reactivity',
                            [
                                navTopic('Activities'),
                                navTopic('Routing', true),
                                navTopic('Lazy Imports')
                            ],
                            true
                        ),
                        navGroup('Server-first', [
                            navTopic('Server Rendering'),
                            navTopic('Client Hydration')
                        ])
                    ]
                })
            })
        })
};
