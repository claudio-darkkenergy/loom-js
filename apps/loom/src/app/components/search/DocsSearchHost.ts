import { component, lazyImport } from '@loom-js/core';

import './search.module.css';
import { docsSearchToggle } from '@/app/logic/activity/toggles';

// Starts loading on the first open only; cached for the window after. The
// importer resolves the component itself, as the lazy-import idiom goes.
const docsSearch = () =>
    lazyImport(
        'docs-search',
        async () => (await import('./DocsSearch')).DocsSearch
    );

/**
 * Mounts the docs search palette on first open and keeps it mounted after,
 * so later opens are instant and every close runs through the dialog's own
 * `close()`. Until then it renders nothing — the prerender never opens it,
 * so the palette, ranker and index stay out of every route's bundle.
 */
export const DocsSearchHost = component((html) => {
    let hasOpened = false;

    return html`
        ${docsSearchToggle.effect(({ value: isOpen }) => {
            hasOpened ||= isOpen;

            if (!hasOpened) {
                return;
            }

            return docsSearch().effect(({ value: DocsSearch }) =>
                DocsSearch?.({ isOpen })
            );
        })}
    `;
});
