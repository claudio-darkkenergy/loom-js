import { component } from '@loom-js/core';

export type ChevronDirection = 'down' | 'left' | 'right' | 'up';

/** A disclosure arrow, drawn in CSS so it stays crisp at any size. */
export const Chevron = component<{ direction: ChevronDirection }>(
    (html, { direction }) => html`
        <span aria-hidden="true" class=${`chevron is-${direction}`}></span>
    `,
    { name: 'Chevron' }
);
