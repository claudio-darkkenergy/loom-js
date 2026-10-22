import { activity, component, el, type TemplateTagValue } from '@loom-js/core';
import { ArgType, type Meta, type StoryObj } from '@loom-js/storybook';

import { PinkButton } from '../../elements/pink-button';
import { PinkTag } from '../../elements/pink-tag';
import { PinkColor } from '../../types';
import { PinkAvatar } from '../pink-avatar';
import { PinkModal, type PinkModalProps } from './pink-modal';

type DemoProps = PinkModalProps & {
    /** What the modal shows — content, footer, header-start. */
    content?: {
        children?: TemplateTagValue;
        /** Builds the footer; returning `undefined` renders none. */
        footer?: (close: () => void) => TemplateTagValue;
        headerStart?: TemplateTagValue;
    };
    /** The trigger button's label. */
    triggerLabel?: string;
};

// Footer buttons close through the open state, like a caller's would.
const footerButtons = (
    close: () => void,
    { cancel = 'Button', confirm = 'Button' } = {}
) =>
    el('div')({
        className: 'u-flex u-main-end u-gap-16',
        children: [
            PinkButton({ children: cancel, isText: true, onClick: close }),
            PinkButton({ children: confirm, isSecondary: true, onClick: close })
        ]
    });

// A trigger button plus the modal it opens. Every close path (Escape, the
// close button, the backdrop, a footer button) reports through `onClose`.
const ModalDemo = ({
    content = {},
    isOpen = false,
    triggerLabel = 'Open Modal',
    ...props
}: DemoProps) => {
    const open = activity(isOpen);
    const close = () => open.update(false);

    return [
        PinkButton({
            children: triggerLabel,
            onClick: () => open.update(true)
        }),
        open.effect(({ value }) =>
            PinkModal({
                ...props,
                children: content.children,
                footer: (content.footer ?? footerButtons)(close),
                isOpen: value,
                onClose: close,
                slots:
                    content.headerStart === undefined
                        ? undefined
                        : { headerStart: content.headerStart }
            })
        )
    ];
};

const exclamationAvatar = () =>
    PinkAvatar({
        color: PinkColor.Orange,
        children: el('span')({
            attrs: { 'aria-hidden': true },
            className: 'icon-exclamation'
        })
    });

const labelText = () => el('p')({ children: 'Modal label text.' });

// Pink's separate-header example: a password field and a text field with
// option buttons, in a form list.
const SeparateHeaderForm = component(
    (html) => html`
        <ul class="form-list">
            <li class="form-item">
                <label class="label">Label</label>
                <div class="input-text-wrapper" style="--amount-of-buttons: 1">
                    <input
                        class="input-text"
                        placeholder="Placeholder"
                        type="password"
                    />
                    <button
                        aria-label="show password"
                        class="show-password-button"
                        type="button"
                    >
                        <span aria-hidden="true" class="icon-eye"></span>
                    </button>
                </div>
            </li>
            <li class="form-item">
                <label class="label">Label</label>
                <div class="input-text-wrapper" style="--amount-of-buttons: 2">
                    <input placeholder="Placeholder" type="text" />
                    <div class="options-list">
                        <button
                            aria-label="show password / hide password"
                            class="options-list-button"
                            type="button"
                        >
                            <span aria-hidden="true" class="icon-eye"></span>
                        </button>
                        <button
                            aria-label="copy text"
                            class="options-list-button"
                            type="button"
                        >
                            <span
                                aria-hidden="true"
                                class="icon-duplicate"
                            ></span>
                        </button>
                    </div>
                </div>
            </li>
        </ul>
    `
);

const meta: Meta<DemoProps> = {
    title: 'Components/PinkModal',
    render: ModalDemo,
    args: {
        closeOnEscape: true,
        closeOnOutsideClick: false,
        isOpen: false,
        isSeparateHeader: false,
        size: undefined,
        title: 'Modal title'
    },
    argTypes: {
        content: ArgType.disable,
        description: { control: 'text' },
        footer: ArgType.disable,
        onClose: ArgType.disable,
        size: {
            control: 'select',
            mapping: { medium: undefined },
            options: ['medium', 'small', 'big', 'huge']
        },
        triggerLabel: ArgType.disable
    }
};

export default meta;

type Story = StoryObj<DemoProps>;

/** Pink's components example: avatar, title, label text, two buttons. */
export const Default: Story = {
    render: (args) =>
        ModalDemo({
            ...args,
            content: {
                children: labelText(),
                headerStart: exclamationAvatar()
            }
        })
};

/** The three sizes the Appwrite console uses: small, medium and big. */
export const Sizes: Story = {
    argTypes: { size: ArgType.disable },
    render: (args) =>
        el('div')({
            className: 'u-flex u-gap-16',
            children: (['small', undefined, 'big'] as const).flatMap((size) =>
                ModalDemo({
                    ...args,
                    content: { children: labelText() },
                    size,
                    triggerLabel: `Open ${size ?? 'medium'}`
                })
            )
        })
};

/** `is-separate-header`: a border under the header, with a description. */
export const SeparateHeader: Story = {
    args: {
        description: 'Provide contextual feedback messages for complex modals.',
        isSeparateHeader: true,
        size: 'big'
    },
    render: (args) =>
        ModalDemo({
            ...args,
            content: { children: SeparateHeaderForm() }
        })
};

/**
 * Modals are used mostly for the creation or deletion of an object. They
 * can include avatars, buttons, illustrations, tags and text.
 */
export const BestPractice: Story = {
    args: {
        size: 'small',
        title: 'Delete project'
    },
    render: (args) =>
        ModalDemo({
            ...args,
            content: {
                children: [
                    el('p')({
                        children: [
                            'Are you sure you want to delete ',
                            PinkTag({ children: 'loom-docs' }),
                            ' and all of its data? This cannot be undone.'
                        ]
                    })
                ],
                footer: (close) =>
                    footerButtons(close, {
                        cancel: 'Cancel',
                        confirm: 'Delete'
                    }),
                headerStart: exclamationAvatar()
            },
            triggerLabel: 'Delete project'
        })
};

/** Escape does nothing; a click on the backdrop closes. */
export const CloseBehaviors: Story = {
    args: {
        closeOnEscape: false,
        closeOnOutsideClick: true,
        description: 'Escape is ignored here. Click outside to close.'
    },
    render: (args) => ModalDemo({ ...args, content: { children: labelText() } })
};

/** Content only — no footer region renders. */
export const WithoutFooter: Story = {
    args: {
        size: 'small'
    },
    render: (args) =>
        ModalDemo({
            ...args,
            content: {
                children: el('p')({ children: 'Content only.' }),
                footer: () => undefined
            }
        })
};
