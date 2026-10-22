import type { ComponentOutputProps } from '@loom-js/core';

import { docsSearchToggle } from '../activity/toggles';

type ShortcutHost = Pick<ComponentOutputProps, 'onMounted' | 'onUnmounted'>;

// Cmd+K (Apple) / Ctrl+K (elsewhere), and nothing else — the Shift and Alt
// variants stay with the browser.
const isSearchChord = (event: KeyboardEvent) =>
    (event.metaKey || event.ctrlKey) &&
    !event.shiftKey &&
    !event.altKey &&
    event.key.toLowerCase() === 'k';

const onKeydown = (event: KeyboardEvent) => {
    if (!isSearchChord(event)) {
        return;
    }

    // Firefox and Chrome both own Ctrl+K; the page takes it once focused.
    event.preventDefault();
    docsSearchToggle.update(null);
};

/**
 * Toggles the docs search palette on Cmd/Ctrl+K for the lifetime of the
 * hosting view. Browser-only by construction: the listener hangs off
 * `onMounted`, which never fires on the server.
 */
export const useSearchShortcut = ({ onMounted, onUnmounted }: ShortcutHost) => {
    onMounted(() => window.addEventListener('keydown', onKeydown));
    onUnmounted(() => window.removeEventListener('keydown', onKeydown));
};
