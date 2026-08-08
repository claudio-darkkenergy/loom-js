import { component } from '../../../src';
import type { PlainObject } from '../../../src/types';

// Shared fixtures for the compile-component-tags suites — module-level so
// template-function identity is stable. Each spec file runs in its own
// browser context, so importing these registers nothing globally shared.

export const Chip = component<{ label?: string }>(
    (html, { label }) => html`
        <i data-chip=${label}></i>
    `
);

export const Panel = component(
    (html, { children }) => html`
        <section data-panel>${children}</section>
    `
);

export const Card = component(
    (html, { children, slots }) => html`
        <article>
            <header data-header>${slots?.header}</header>
            <div data-body>${children}</div>
            <footer data-footer>${slots?.footer}</footer>
        </article>
    `
);

export const PanelAndMarker = component<{ value?: string }>(
    (html, { value }) => html`
        <div>
            <${Panel}>inner</>
            <em data-outer=${value}></em>
        </div>
    `
);

// Captures the props a probe component actually received, so specs can assert
// on prop identity rather than rendered text. Reset in `beforeEach`.
export const probed: { props: PlainObject | null } = { props: null };

export const PropsProbe = component<PlainObject>((html, props) => {
    probed.props = props;
    return html`
        <i data-probe></i>
    `;
});
