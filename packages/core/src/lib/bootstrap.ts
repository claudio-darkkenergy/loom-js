// Shared client-boot internals — `init` and `hydrate` differ only in when the
// destination root receives the app (immediate mount vs deferred swap); the
// bootstrap steps around that moment are identical and live here.
import { appendEvents, setDebug, setToken } from '../config';
import type { AppGlobalConfig, LoomGlobal } from '../types';
import { getDocument, getWindow } from './dom';
import { mount } from './mount';

export const bootstrap = () => {
    ((globalThis as any).loom as LoomGlobal) = {
        // The runtime switch for opt-in debug narration — reachable from the
        // devtools console (`loom.setDebug({ updates: true })`) so narration
        // never has to ship enabled to be usable. The console proxy itself
        // stays internal: nothing consumer-facing needs the handle, and
        // exposing it invited cached-method-reference misuse.
        setDebug
    };
};

export const configApp = ({
    debug,
    debugScope,
    events,
    token
}: AppGlobalConfig) => {
    debug !== undefined && setDebug(debug, debugScope);
    events && appendEvents(events);
    token && setToken(token);
};

/**
 * Applies the boot entries' shared root guard — the app root cannot be the
 * document HEAD or BODY; a violating (or missing) root is replaced with a
 * fresh `#loom-app` element prepended to the body.
 */
export const resolveAppRoot = (root: Element | null): Element => {
    const { HTMLBodyElement, HTMLHeadElement } = getWindow();

    if (
        root === null ||
        root instanceof HTMLHeadElement ||
        root instanceof HTMLBodyElement
    ) {
        const appRoot = getDocument().createElement('div');

        appRoot.id = 'loom-app';
        // Mount the detatched root to the document body.
        mount(undefined, appRoot, 'prepend');

        return appRoot;
    }

    return root;
};
