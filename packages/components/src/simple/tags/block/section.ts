import { component } from '@loom-js/core';

export interface SectionProps {
    role?: string;
}

export const Section = component<SectionProps>(
    (html, { children, className, role }) =>
        html`<section class=${className} role=${role}>${children}</section>`
);
