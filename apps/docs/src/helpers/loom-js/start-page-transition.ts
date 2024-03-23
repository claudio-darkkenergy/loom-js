import { onRoute } from '@loom-js/core';

type Doc = Document & {
    startViewTransition?: (change: () => any) => ViewTransition;
};

export interface ViewTransition {
    finished: Promise<void>;
    ready: Promise<void>;
    skipTransition(): void;
    updateCallbackDone: Promise<void>;
}

export type ViewTransitionOnRouteParams = Parameters<typeof onRoute>;

export type ViewTransitionSetup = ((...args: unknown[]) => any) | null;

export const startPageTransition = (
    setup: ViewTransitionSetup,
    ...args: ViewTransitionOnRouteParams
) => {
    const doc = document as Doc;

    if (doc.startViewTransition) {
        setup && setup();
        return doc.startViewTransition(() => onRoute(...args));
    }

    onRoute(...args);
};
