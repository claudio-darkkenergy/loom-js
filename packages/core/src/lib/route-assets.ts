import type { DomWindow } from './dom';
import { formatDiagnostic } from './globals/diagnostic-format';
import { loomConsole } from './globals/loom-console';

/**
 * Loads a route's declared stylesheets into the window's document and
 * resolves once every URL has settled. A URL already present as a
 * stylesheet link counts as loaded. A failed load resolves after a debug
 * log, so styling degrades without blocking the navigation. Windows that
 * can't load resources (server provider DOMs) skip entirely.
 */
export const loadRouteAssets = (
    win: DomWindow,
    urls: string[] | undefined
): Promise<void> => {
    // `matchMedia` marks a real browser window — a provider DOM has no
    // network stack, never fires stylesheet load events, and would hang
    // the await.
    if (
        !urls?.length ||
        typeof (win as { matchMedia?: unknown }).matchMedia !== 'function'
    ) {
        return Promise.resolve();
    }

    const doc = win.document as Document;

    return Promise.all(urls.map((url) => loadStylesheet(doc, url))).then(
        () => undefined
    );
};

const loadStylesheet = (doc: Document, url: string) =>
    new Promise<void>((resolve) => {
        const resolvedHref = new URL(url, doc.baseURI).href;
        const links = doc.querySelectorAll<HTMLLinkElement>(
            'link[rel="stylesheet"]'
        );

        for (const link of links) {
            if (link.href === resolvedHref) {
                return resolve();
            }
        }

        const link = doc.createElement('link');

        link.rel = 'stylesheet';
        link.href = url;
        link.addEventListener('load', () => resolve(), { once: true });
        link.addEventListener(
            'error',
            () => {
                loomConsole.info(
                    ...formatDiagnostic({
                        detail: `${url} — the route renders without it`,
                        event: 'stylesheet failed to load',
                        scope: 'route assets'
                    })
                );
                resolve();
            },
            { once: true }
        );
        doc.head.appendChild(link);
    });
