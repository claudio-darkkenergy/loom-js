import {
    dehydrate,
    renderToString,
    serializeState
} from '@loom-js/core/server';

import { App, GREETING_KEY } from './app';

export const greetingKey = GREETING_KEY;

export const listPages = async () => ['/', '/docs/alpha', '/docs/beta'];

// The server entry's d.ts duplicates core's shared types, so the same
// runtime `ContextFunction` fails to type-check across the two bundles —
// cast at this one boundary until the type rollup is unified.
type ServerRenderable = Parameters<typeof renderToString>[0];

export const prerenderRoute = async (url: string, window: object) => {
    const html = await renderToString(App() as unknown as ServerRenderable, {
        url,
        window
    });

    return { html, state: serializeState(dehydrate(window)) };
};
