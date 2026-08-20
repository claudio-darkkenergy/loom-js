import { component } from '@loom-js/core';

export type ContentLoadErrorProps = {
    message?: string;
};

/**
 * Renders in place of content whose load failed — the terminal state the
 * skeleton loaders hand off to, never a permanent shimmer.
 */
export const ContentLoadError = component<ContentLoadErrorProps>(
    (html, { className, message }) => html`
        <div class=${className} role="alert">
            <h1 class="heading-level-3">Content failed to load</h1>
            <p>
                ${message || 'Something went wrong while loading this content.'}
            </p>
            <p>Please refresh the page to try again.</p>
        </div>
    `
);
