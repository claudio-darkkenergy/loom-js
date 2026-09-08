import type { ComponentInputProps, TemplateTagValue } from '@loom-js/core';

import {
    PinkCopyButton,
    type PinkCopyButtonProps
} from '../elements/pink-copy-button/pink-copy-button';

export interface WithAnchorLinkProps {
    [key: string]: unknown;
    // The host's anchor id — the modifier applies only when provided.
    anchorId?: string;
    // Props for the appended copy-link control; each overrides a default
    // (`icon: 'icon-link'`, the `#anchorId` href, the absolute-URL `text`
    // getter, the labels).
    anchorProps?: Partial<ComponentInputProps<PinkCopyButtonProps>>;
}

// Absolute, so the copied link works pasted anywhere. Read at click time —
// `location` stays off the render path (prerender-safe).
const absoluteAnchorUrl = (anchorId: string) => () =>
    `${location.origin}${location.pathname}#${anchorId}`;

/**
 * Gives the host an anchor identity and its copy-link affordance: sets
 * `id: anchorId` and appends a `PinkCopyButton` anchored to `#anchorId`
 * (native link semantics; copies the absolute URL). No `anchorId`, no-op.
 */
export const withAnchorLink = <T>({
    anchorId,
    anchorProps = {},
    children,
    ...props
}: ComponentInputProps<T & WithAnchorLinkProps>) => {
    if (anchorId === undefined) {
        return { ...props, children } as T;
    }

    return {
        ...props,
        children: ([] as TemplateTagValue[]).concat(
            (children as TemplateTagValue) ?? [],
            PinkCopyButton({
                copiedLabel: 'Link copied!',
                href: `#${anchorId}`,
                icon: 'icon-link',
                label: 'Copy link',
                text: absoluteAnchorUrl(anchorId),
                ...anchorProps
            }) as TemplateTagValue
        ),
        id: anchorId
    } as T;
};
