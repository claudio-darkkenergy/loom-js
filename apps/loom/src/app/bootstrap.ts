import '@appwrite.io/pink';
import '@appwrite.io/pink-icons';
import { hydrate, primeResources } from '@loom-js/core';
// Type-only: the index bundle doesn't export `DehydratedState` yet, and
// `import type` is erased, so no server code reaches the browser bundle.
import type { DehydratedState } from '@loom-js/core/server';
import '@loom-js/pink/styles/code-tokens.css';

import { App } from './app';
import { APP_ROOT_ID, STATE_SCRIPT_ID } from './boot-contract';

if (__DEV__) {
    // esbuild's live-reload hook. The define makes this dead code in prod,
    // so the minifier drops it entirely.
    new EventSource('/esbuild').addEventListener('change', () =>
        location.reload()
    );
}

if (!__DEV__) {
    // MyFonts license count beacon, fired async so it never sits in the
    // critical path, and only on production traffic.
    fetch('https://hello.myfonts.net/count/40024c', { mode: 'no-cors' }).catch(
        () => undefined
    );
}

// Reads the embedded state payload on a prerendered page. Dev and fallback
// shells serve the slot empty; a malformed payload boots unprimed.
const readEmbeddedState = (): DehydratedState | undefined => {
    const payload = document
        .getElementById(STATE_SCRIPT_ID)
        ?.textContent?.trim();

    if (!payload) {
        return undefined;
    }

    try {
        return JSON.parse(payload) as DehydratedState;
    } catch (_parseError) {
        console.warn(
            '[loom app] embedded state did not parse — booting unprimed.'
        );

        return undefined;
    }
};

/**
 * The one boot path for every environment: prime the resource cache from
 * the embedded state when present, then `hydrate` onto the shell-owned
 * root. Prerendered pages take over flash-free with no first-render
 * network; dev and fallback shells mount their empty root right away.
 */
const boot = () => {
    const embeddedState = readEmbeddedState();

    embeddedState && primeResources(embeddedState);

    hydrate({
        app: App(),
        // Debug narration stays opt-in — a docs topic swap with `updates`
        // narration on costs seconds of main-thread time with DevTools
        // open. Enable ad hoc from the console via `loom` / `setDebug`.
        globalConfig: {
            debug: false
        },
        // The shell owns the root; the `body` fallback only covers a stale
        // cached shell from before the slot existed.
        root: document.getElementById(APP_ROOT_ID) ?? undefined
    });
};

boot();
