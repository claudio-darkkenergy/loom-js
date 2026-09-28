import { component } from '../../../src';
import type { TestComponentProps } from './container';

// Fixtures for the template whitespace collapse. The templates are
// `prettier-ignore`d — their line breaks are the input under test.

// A whitespace-sensitive element holding a sole slot child.
// prettier-ignore
export const FormattedCode = component<TestComponentProps>(
    (html, { value }) => html`
        <code style="white-space: pre-wrap">
            ${value}
        </code>
    `
);

// Two slots on separate lines.
// prettier-ignore
export const SlotPair = component<TestComponentProps>(
    (html, { value: [first, second] = [] }) => html`
        <span>
            ${first}
            ${second}
        </span>
    `
);

const Emphasis = component(
    (html, { children }) => html`
        <em>${children}</em>
    `
);

// A component element whose children region spans lines.
// prettier-ignore
export const ChildrenRegion = component<TestComponentProps>(
    (html) => html`
        <p>
            <${Emphasis}>
                wrapped
                text
            </>
        </p>
    `
);

// prettier-ignore
const Row = component<{ label?: string }>(
    (html, { label }) => html`
        <tr>
            <td>${label}</td>
        </tr>
    `
);

// Table-content slots on separate lines.
// prettier-ignore
export const RowPair = component<TestComponentProps>(
    (html, { value: [first, second] = [] }) => html`
        <table>
            <tbody>
                ${Row({ label: first })}
                ${Row({ label: second })}
            </tbody>
        </table>
    `
);

// Same-line spacing, cross-line content, and a preformatted block together.
// prettier-ignore
export const WhitespaceHeavy = component<TestComponentProps>(
    (html, { value }) => html`
        <article>
            <h1>Hello <b>world</b></h1>
            <p>
                Total:
                ${value}
                items
            </p>
            <pre>
  kept
    ${value}
</pre>
            <span> ${value} </span>
        </article>
    `
);
