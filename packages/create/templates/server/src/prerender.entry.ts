// The server module: built next to the client so markup and state match the
// shipped app. `loom build` calls `prerenderRoute` once per route.

import {
    dehydrate,
    renderToString,
    serializeState
} from '@loom-js/core/server';

import { App } from './app';

export { routes } from './routes';

// The server entry's types duplicate core's, so the same runtime value needs
// a cast at this one boundary.
type ServerRenderable = Parameters<typeof renderToString>[0];

/** Renders one route: its markup plus the state the client primes from. */
export const prerenderRoute = async (url: string, window: object) => {
    const html = await renderToString(App() as unknown as ServerRenderable, {
        url,
        window
    });

    return { html, state: serializeState(dehydrate(window)) };
};
