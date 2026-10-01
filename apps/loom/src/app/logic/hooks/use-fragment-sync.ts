import type { ComponentOutputProps } from '@loom-js/core';

import {
    activeFragment,
    readFragment,
    syncActiveFragment
} from '../activity/active-fragment';

// The active region: a heading's section is current once the heading's top
// has crossed this share of the viewport height.
const ACTIVE_REGION = 0.33;
// Scroll rest without `scrollend`: quiet for this long after the last
// scroll event.
const SCROLL_REST_DELAY = 250;
// Bound on a hold whose owed scroll never arrives (the target was already in
// place) — mirrors the router's settlement bound.
const HOLD_MAX_WAIT = 4000;
// Input that can only be the reader's — a programmatic scroll produces none
// of these, so any one of them ends a hold at once.
const READER_INPUT_EVENTS = ['keydown', 'touchmove', 'wheel'] as const;

type FragmentSyncHost = Pick<
    ComponentOutputProps,
    'onMounted' | 'onRendered' | 'onUnmounted'
>;

// Same ids the TOC links carry — the anchor pass gives every h2/h3 one.
const anchoredHeadings = (root: HTMLElement) =>
    Array.from(root.querySelectorAll<HTMLElement>('h2[id], h3[id]'));

/**
 * The scroll spy: resolves the section in view and reflects it into the URL
 * (replace only — no entry, no event, no scroll) and `activeFragment`.
 * Writes only on a change after arming, never while held — a hold covers
 * the programmatic scrolls the router and native anchor jumps owe after a
 * hash arrives, and lifts once that scroll settles.
 */
const createFragmentSpy = (win: Window) => {
    let headings: HTMLElement[] = [];
    let observer: IntersectionObserver | undefined;
    // The resolved section; the first resolution after arming is the
    // baseline and is not written.
    let current = '';
    let baselined = false;
    let held = false;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let restTimer: ReturnType<typeof setTimeout> | undefined;

    // Last heading above the active line; the last heading outright once the
    // page is scrolled to its end (a short final section can't reach the
    // line); none above the first.
    const resolveActive = () => {
        const lastHeading = headings[headings.length - 1];

        if (!lastHeading) {
            return '';
        }

        const { scrollHeight } = win.document.documentElement;
        const atBottom =
            scrollHeight > win.innerHeight &&
            win.scrollY + win.innerHeight >= scrollHeight - 1;

        if (atBottom) {
            return lastHeading.id;
        }

        const line = win.innerHeight * ACTIVE_REGION;
        let active = '';

        for (const heading of headings) {
            if (heading.getBoundingClientRect().top > line) {
                break;
            }

            active = heading.id;
        }

        return active;
    };

    const write = (fragment: string) => {
        if (fragment === readFragment(win)) {
            return;
        }

        const { pathname, search } = win.location;

        // The entry's state (the router's captured offset) rides along.
        win.history.replaceState(
            win.history.state,
            '',
            `${pathname}${search}${fragment && `#${fragment}`}`
        );
        activeFragment.update(fragment);
    };

    const track = () => {
        const next = resolveActive();
        const changed = baselined && next !== current;

        current = next;
        baselined = true;
        changed && !held && write(next);
    };

    const release = () => {
        held = false;
        clearTimeout(holdTimer);
    };

    const hold = () => {
        held = true;
        clearTimeout(holdTimer);
        holdTimer = setTimeout(release, HOLD_MAX_WAIT);
    };

    // A settled scroll lifts a hold; otherwise it re-resolves, since reaching
    // the page end needn't move any heading across the line.
    const onScrollRest = () => (held ? release() : track());
    const hasScrollEnd = 'onscrollend' in (win as object);
    const onScroll = () => {
        clearTimeout(restTimer);
        restTimer = setTimeout(onScrollRest, SCROLL_REST_DELAY);
    };
    // Traversal and native anchor jumps: mirror the arrived hash and hold
    // for the scroll it owes.
    const onHashArrival = () => {
        syncActiveFragment(win);
        hold();
    };

    win.addEventListener('popstate', onHashArrival);
    win.addEventListener('hashchange', onHashArrival);
    READER_INPUT_EVENTS.forEach((type) =>
        win.addEventListener(type, release, { passive: true })
    );
    hasScrollEnd
        ? win.addEventListener('scrollend', onScrollRest)
        : win.addEventListener('scroll', onScroll, { passive: true });

    return {
        // Per topic render: the headings are the render's, the hash is the
        // navigation's, and the arrival's scroll (settlement, restore, top)
        // is still owed.
        arm(root: HTMLElement) {
            observer?.disconnect();
            headings = anchoredHeadings(root);
            baselined = false;
            hold();
            syncActiveFragment(win);

            if (typeof IntersectionObserver !== 'function') {
                return;
            }

            observer = new IntersectionObserver(track, {
                rootMargin: `0px 0px -${Math.round((1 - ACTIVE_REGION) * 100)}% 0px`
            });
            headings.forEach((heading) => observer?.observe(heading));
        },
        dispose() {
            observer?.disconnect();
            clearTimeout(holdTimer);
            clearTimeout(restTimer);
            win.removeEventListener('popstate', onHashArrival);
            win.removeEventListener('hashchange', onHashArrival);
            READER_INPUT_EVENTS.forEach((type) =>
                win.removeEventListener(type, release)
            );
            hasScrollEnd
                ? win.removeEventListener('scrollend', onScrollRest)
                : win.removeEventListener('scroll', onScroll);
        }
    };
};

/**
 * Keeps the URL fragment and `activeFragment` in step with the section the
 * reader is on, for the lifetime of the hosting view. Browser-only by
 * construction: everything hangs off `onMounted`, which never fires on the
 * server, and re-arms on every render so a topic swap observes the new
 * headings.
 */
export const useFragmentSync = ({
    onMounted,
    onRendered,
    onUnmounted
}: FragmentSyncHost) => {
    let spy: ReturnType<typeof createFragmentSpy> | undefined;

    onMounted((root) => {
        spy = createFragmentSpy(window);
        spy.arm(root as HTMLElement);
    });
    onRendered((root) => spy?.arm(root as HTMLElement));
    onUnmounted(() => {
        spy?.dispose();
        spy = undefined;
    });
};
