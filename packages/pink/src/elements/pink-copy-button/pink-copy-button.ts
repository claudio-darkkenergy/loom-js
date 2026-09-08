import { type ComponentInputProps, simple } from '@loom-js/core';

import {
    type CopyState,
    PinkCopyToClipboard,
    type PinkCopyToClipboardProps
} from '../../behaviors/pink-copy-to-clipboard';
import { PinkButton } from '../pink-button';

export interface PinkCopyButtonProps extends Omit<
    PinkCopyToClipboardProps,
    'is' | 'render'
> {
    // A custom button size — sets pink's `--p-button-size`.
    buttonSize?: string;
    // The icon shown while in the copied state.
    copiedIcon?: string;
    // With `href` set, the control is an anchor — native link behavior
    // (status bar, right-click copy, modified clicks) stays intact alongside
    // the copy.
    href?: string;
    // The idle icon.
    icon?: string;
    // Lands on the button/anchor itself (not the behavior host) — e.g. a
    // router handler for an `href`, which reads the anchor off the event.
    onClick?: EventListener;
}

/**
 * An icon-only text button (or anchor, with `href`) carrying the
 * copy-to-clipboard behavior. The icon class is bound to the copied state,
 * so the same node updates in place; the tooltip label follows suit.
 */
export const PinkCopyButton = simple<ComponentInputProps<PinkCopyButtonProps>>(
    ({
        buttonSize,
        copiedIcon = 'icon-check',
        href,
        icon = 'icon-duplicate',
        label = 'Copy',
        onClick,
        ...props
    }) =>
        PinkCopyToClipboard({
            ...props,
            label,
            render: (copied: CopyState) =>
                PinkButton({
                    attrs: { 'aria-label': label },
                    buttonSize,
                    href,
                    icon: copied.bind((isCopied) =>
                        isCopied ? copiedIcon : icon
                    ),
                    isOnlyIcon: true,
                    isText: true,
                    onClick
                })
        })
);
