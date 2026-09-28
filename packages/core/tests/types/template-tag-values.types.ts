// Compile-time assertions for the template value surface: component
// callables in the tag position and `bind()` values inside `$attrs` —
// covered by `type-check-tests`; never executed.
import { activity, component, simple } from '../../src';
import type { AttrsTemplateTagValue } from '../../src/types';

const Card = component<{ heading: string }>(
    (html, { heading }) => html`
        <article>${heading}</article>
    `
);
const Shell = simple<{ heading: string }>(({ heading }) => Card({ heading }));
const Super = ({ heading }: { heading: string }) => Card({ heading });
const count = ({ heading }: { heading: string }) => heading.length;
const isBusy = activity(false);

// Required-props callables type-check as tags, without a cast.
export const RequiredPropsTags = component(
    (html) => html`
        <${Card} heading="Docs" />
        <${Shell} heading="Docs" />
        <${Super} heading="Docs" />
    `
);

// A function that returns no renderable context stays rejected.
export const RejectedTag = component(
    (html) => html`
        <!-- prettier-ignore -->
        <${
            // @ts-expect-error — `number` is not a `ContextFunction`.
            count
        } heading="Docs" />
    `
);

// A `bind()` value is a valid `$attrs` entry.
export const boundAttrs: AttrsTemplateTagValue = {
    'aria-busy': isBusy.bind((busy) => String(busy))
};

export const BoundAttrsEntry = component(
    (html) => html`
        <div $attrs=${boundAttrs}></div>
    `
);
