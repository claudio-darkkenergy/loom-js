import { component, el, type TemplateTagValue } from '@loom-js/core';

import { PinkButton } from '../../elements/pink-button';
import { cn } from '../../utils/cn';

export type PinkModalSize = 'small' | 'big' | 'huge';

export interface PinkModalProps {
    /** Closes on Escape (the dialog's native cancel). Default `true`. */
    closeOnEscape?: boolean;
    /** Closes on a click outside the modal, on the backdrop. Default `false`. */
    closeOnOutsideClick?: boolean;
    /** Contextual text under the title, inside the header. */
    description?: TemplateTagValue;
    /** Renders in the footer region — omitted, no footer renders. */
    footer?: TemplateTagValue;
    /** Drives the native `showModal()` / `close()` once the node is live. */
    isOpen?: boolean;
    /** Pink's `is-separate-header`: a border between the header and content. */
    isSeparateHeader?: boolean;
    /**
     * Fires once per close, from the dialog's native `close` event — so
     * Escape, the close button and `isOpen` turning false all report alike.
     */
    onClose?: () => void;
    /** The width preset; omitted is pink's default (medium) width. */
    size?: PinkModalSize;
    /** The heading in the header, beside the close button. */
    title?: TemplateTagValue;
}

// Instance-unique fallback ids for the title, so `aria-labelledby` resolves
// even when the caller passes no `id`.
let modalCount = 0;

type OpenState = Pick<
    PinkModalProps,
    'closeOnEscape' | 'closeOnOutsideClick' | 'isOpen'
>;

const FOCUSABLE =
    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

// Where focus lands on open: an `autofocus` element first, else the first
// focusable control in the content, then the footer. Nothing there leaves
// the native choice (the close button).
const focusFirst = (dialog: HTMLDialogElement) => {
    const target =
        dialog.querySelector<HTMLElement>('[autofocus]') ??
        dialog.querySelector<HTMLElement>(`.modal-content :is(${FOCUSABLE})`) ??
        dialog.querySelector<HTMLElement>(`.modal-footer :is(${FOCUSABLE})`);

    target?.focus();
};

// Pink's modal has no reactive layer: the `open` state belongs to the
// element, so the prop is reconciled against it after every render. A
// detached dialog can't open (`showModal` throws), so mount reconciles too.
const syncOpenState = (dialog: HTMLDialogElement, isOpen?: boolean) => {
    if (typeof dialog.showModal !== 'function' || !dialog.isConnected) {
        return;
    }

    if (isOpen && !dialog.open) {
        dialog.showModal();
        focusFirst(dialog);
    } else if (!isOpen && dialog.open) {
        dialog.close();
    }
};

/**
 * Pink Design's modal over a native `<dialog>`: a header with the title, an
 * optional description and a close button, a content region holding
 * `children`, and an optional footer. A `headerStart` named slot renders
 * before the title (e.g. an avatar); the title labels the dialog. Open and close through `isOpen`;
 * every close path reports through `onClose`. Focus lands on the content's
 * first control (or an `autofocus` element) when the modal opens.
 *
 * ```ts
 * html`
 *     <${PinkModal}
 *         isOpen=${isOpen}
 *         onClose=${() => setOpen(false)}
 *         size="small"
 *         title="Delete project"
 *     >
 *         <p>This cannot be undone.</p>
 *     </>
 * `;
 * ```
 */
export const PinkModal = component<PinkModalProps>(
    (
        html,
        {
            attrs,
            children,
            className,
            closeOnEscape = true,
            closeOnOutsideClick = false,
            description,
            footer,
            id,
            isOpen,
            isSeparateHeader,
            onClose,
            onMounted,
            onRendered,
            own,
            size,
            slots,
            style,
            title
        }
    ) => {
        const titleId = own(() =>
            id ? `${id}-title` : `pink-modal-title-${++modalCount}`
        );
        // Hook handlers register on the first render only, so they read the
        // props through instance state that every render refreshes.
        const state = own<OpenState>(() => ({}));
        const syncOpen = (node: unknown) =>
            syncOpenState(node as HTMLDialogElement, state.isOpen);

        Object.assign(state, { closeOnEscape, closeOnOutsideClick, isOpen });
        onMounted(syncOpen);
        onRendered(syncOpen);

        return html`
            <dialog
                $attrs=${attrs}
                $cancel=${(event: Event) =>
                    state.closeOnEscape || event.preventDefault()}
                $click=${(event: Event) => {
                    // The form fills the dialog, so a click whose target is
                    // the dialog itself landed on the backdrop.
                    if (
                        state.closeOnOutsideClick &&
                        event.target === event.currentTarget
                    ) {
                        (event.currentTarget as HTMLDialogElement).close();
                    }
                }}
                $close=${() => onClose?.()}
                aria-labelledby=${titleId}
                class=${cn(className, 'modal', size && `is-${size}`, {
                    'is-separate-header': isSeparateHeader,
                    // Pink's `.modal` is `display: flex` even when closed;
                    // the utility hides a closed dialog in flow.
                    'u-hide': !isOpen
                })}
                id=${id}
                style=${style}
            >
                <form class="modal-form" method="dialog">
                    <header class="modal-header">
                        <div
                            class="u-flex u-main-space-between u-cross-center u-gap-16"
                        >
                            ${slots?.headerStart}
                            <h4
                                class="modal-title heading-level-5"
                                id=${titleId}
                            >
                                ${title}
                            </h4>
                            <${PinkButton}
                                attrs=${{ 'aria-label': 'Close modal' }}
                                className="is-small u-cross-center u-margin-inline-start-auto"
                                icon="icon-x"
                                isOnlyIcon
                                isText
                                type="submit"
                            />
                        </div>
                        ${
                            description === undefined
                                ? undefined
                                : el('p')({ children: description })
                        }
                    </header>
                    <div class="modal-content">
                        <div class="modal-content-spacer">${children}</div>
                    </div>
                    ${
                        footer === undefined
                            ? undefined
                            : el('div')({
                                  children: footer,
                                  className: 'modal-footer'
                              })
                    }
                </form>
            </dialog>
        `;
    }
);
