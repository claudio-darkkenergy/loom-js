import { component } from '../../../src';
import type { LifeCycleHandler } from '../../../src/types';

// Root-form fixtures: each reports the root its render produced, so specs
// can assert on what `node()` and the life-cycle handlers receive.
export interface RootFormProps {
    onRoot?: LifeCycleHandler;
}

export const Leaf = component(
    (html) => html`
        <em data-leaf></em>
    `
);

export const SingleElementRoot = component<RootFormProps>(
    (html, { onRendered, onRoot }) => {
        onRendered((root) => onRoot?.(root));

        return html`
            <section data-single></section>
        `;
    }
);

export const SiblingElementsRoot = component<RootFormProps>(
    (html, { onRendered, onRoot }) => {
        onRendered((root) => onRoot?.(root));

        return html`
            <h1 data-first></h1>
            <p data-second></p>
        `;
    }
);

export const ElementAndTextRoot = component<RootFormProps>(
    (html, { onRendered, onRoot }) => {
        onRendered((root) => onRoot?.(root));

        return html`
            label
            <b data-beside-text></b>
        `;
    }
);

export const CommentAndElementRoot = component<RootFormProps>(
    (html, { onRendered, onRoot }) => {
        onRendered((root) => onRoot?.(root));

        return html`
            <!-- note -->
            <b data-beside-comment></b>
        `;
    }
);

export const LoneInterpolationRoot = component<RootFormProps>(
    (html, { onRendered, onRoot }) => {
        onRendered((root) => onRoot?.(root));

        return html`
            ${Leaf()}
        `;
    }
);

export const ComponentOnlyRoot = component<RootFormProps>(
    (html, { onRendered, onRoot }) => {
        onRendered((root) => onRoot?.(root));

        return html`
            <${Leaf} />
            <${Leaf} />
        `;
    }
);

export const LeadingTokenTextRoot = component<RootFormProps>(
    (html, { onRendered, onRoot }) => {
        onRendered((root) => onRoot?.(root));

        return html`
            <>
            <i data-after-token></i>
        `;
    }
);
