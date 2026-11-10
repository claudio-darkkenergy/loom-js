// Keeps the page usable beside the dock: covered content scrolls clear at
// the bottom, flowing content narrows at the side, and fixed elements move
// or shrink out from under it at either edge.
import { type DockEdge, createFixedClearance } from './fixed-clearance';

// Points sampled along the dock's top edge to find covered scroll areas.
const SAMPLE_STEP = 48;
const REMEASURE_FALLBACK_MS = 100;

/** Where the dock sits and how much of the viewport it takes there. */
export interface Reservation {
    edge: 'bottom' | 'side';
    side: 'left' | 'right';
    size: number;
}

interface Padded {
    added: number;
    base: number;
    inline: string;
}

// How much a re-measure redoes: scrolling moves only flowing content.
type Depth = 'scroll' | 'layout' | 'full';

const isScrollArea = (element: Element) =>
    /(auto|scroll|overlay)/.test(getComputedStyle(element).overflowY);

const deeper = (first: Depth | undefined, second: Depth): Depth =>
    first === 'full' || second === 'full'
        ? 'full'
        : first === 'layout' || second === 'layout'
          ? 'layout'
          : 'scroll';

export const createDockSpace = (
    view: Window,
    // The dock's own nodes, which are never padded or sampled.
    ownNodes: () => Element[]
) => {
    const doc = view.document;
    const root = doc.documentElement;
    // Sits just past the page's content, extending the document by the
    // reserved size whatever the page's own `html`/`body` sizing.
    const spacer = doc.createElement('div');
    const padded = new Map<HTMLElement, Padded>();
    // Scroll areas sized by their content: padding would grow them, not
    // let them scroll.
    const contentSized = new WeakSet<HTMLElement>();
    const clearance = createFixedClearance(view, ownNodes);
    const observer = new ResizeObserver(() => requestMeasure('layout'));
    // The `html` padding the page set itself, while a side dock adds to it.
    let rootPadding:
        { base: number; inline: string; property: string } | undefined;
    let current: Reservation | undefined;
    let pendingDepth: Depth | undefined;

    spacer.setAttribute('aria-hidden', 'true');
    Object.assign(spacer.style, {
        pointerEvents: 'none',
        position: 'absolute',
        visibility: 'hidden'
    });

    const scroller = () => doc.scrollingElement ?? root;
    // The viewport area the dock covers.
    const regionOf = ({ edge, side, size }: Reservation) =>
        edge === 'bottom'
            ? new DOMRect(0, view.innerHeight - size, view.innerWidth, size)
            : side === 'right'
              ? new DOMRect(view.innerWidth - size, 0, size, view.innerHeight)
              : new DOMRect(0, 0, size, view.innerHeight);
    const clearanceEdge = ({ edge, side }: Reservation): DockEdge =>
        edge === 'bottom' ? 'bottom' : side;

    // Bottom: always extends the document by the dock's height. Right side:
    // adds sideways room only when content is wider than the window (at the
    // left, overflow already runs away from the dock).
    const extendDocument = ({ edge, side, size }: Reservation) => {
        spacer.style.display = 'none';

        const { clientWidth, scrollHeight, scrollWidth } = scroller();

        spacer.style.display = '';
        Object.assign(
            spacer.style,
            edge === 'bottom'
                ? {
                      height: `${size}px`,
                      left: '0',
                      top: `${scrollHeight}px`,
                      width: '1px'
                  }
                : {
                      height: '1px',
                      left: `${scrollWidth}px`,
                      top: '0',
                      width:
                          side === 'right' && scrollWidth > clientWidth
                              ? `${size}px`
                              : '0'
                  }
        );
    };
    const restoreRootPadding = () => {
        if (rootPadding) {
            root.style.setProperty(rootPadding.property, rootPadding.inline);
            rootPadding = undefined;
        }
    };
    // Narrows the page's flowing content to the space beside a side dock.
    const padRoot = ({ edge, side, size }: Reservation) => {
        const property = side === 'right' ? 'padding-right' : 'padding-left';

        if (edge === 'bottom') {
            restoreRootPadding();
            return;
        }

        rootPadding?.property !== property && restoreRootPadding();
        rootPadding ??= {
            base:
                parseFloat(getComputedStyle(root).getPropertyValue(property)) ||
                0,
            inline: root.style.getPropertyValue(property),
            property
        };
        root.style.setProperty(property, `${rootPadding.base + size}px`);
    };

    // Scroll areas crossing the dock's top edge, other than the document.
    const coveredAreas = (dockTop: number) => {
        const found = new Set<HTMLElement>();
        const own = ownNodes();

        for (let x = 1; x < view.innerWidth; x += SAMPLE_STEP) {
            doc.elementsFromPoint(x, dockTop - 1).forEach((hit) => {
                let element: Element | null = hit;

                while (element && element !== root) {
                    if (own.some((node) => node.contains(element))) {
                        return;
                    }

                    element !== scroller() &&
                        element instanceof HTMLElement &&
                        !contentSized.has(element) &&
                        isScrollArea(element) &&
                        found.add(element);
                    element = element.parentElement;
                }
            });
        }

        return found;
    };
    const restore = (element: HTMLElement) => {
        element.style.paddingBottom = padded.get(element)!.inline;
        padded.delete(element);
    };
    // Pads each covered, height-limited scroll area by the part of it under
    // a bottom dock, so its last content scrolls clear.
    const padCoveredAreas = (reservation: Reservation | undefined) => {
        const dockTop = view.innerHeight - (reservation?.size ?? 0);
        const covered =
            reservation?.edge === 'bottom'
                ? coveredAreas(dockTop)
                : new Set<HTMLElement>();

        padded.forEach(
            (_entry, element) => covered.has(element) || restore(element)
        );
        covered.forEach((element) => {
            const entry = padded.get(element) ?? {
                added: 0,
                base: parseFloat(getComputedStyle(element).paddingBottom) || 0,
                inline: element.style.paddingBottom
            };
            const { bottom, height } = element.getBoundingClientRect();
            const added = Math.max(0, Math.round(bottom - dockTop));

            if (added === entry.added && padded.has(element)) {
                return;
            }

            element.style.paddingBottom = `${entry.base + added}px`;
            padded.set(element, { ...entry, added });

            if (element.getBoundingClientRect().height !== height) {
                restore(element);
                contentSized.add(element);
            }
        });
    };
    const measure = (depth: Depth) => {
        pendingDepth = undefined;

        if (!current) {
            return;
        }

        padRoot(current);
        depth !== 'scroll' &&
            clearance.clear(
                regionOf(current),
                clearanceEdge(current),
                depth === 'full'
            );
        extendDocument(current);
        padCoveredAreas(current);
    };
    // Once per frame; the timer covers pages whose frames are paused.
    const requestMeasure = (depth: Depth) => {
        if (!current) {
            return;
        }

        const scheduled = pendingDepth !== undefined;

        pendingDepth = deeper(pendingDepth, depth);

        if (!scheduled) {
            const measureOnce = () =>
                pendingDepth !== undefined && measure(pendingDepth);

            view.requestAnimationFrame(measureOnce);
            view.setTimeout(measureOnce, REMEASURE_FALLBACK_MS);
        }
    };
    // Content growth, layout changes and toggled UI can all move what the
    // dock covers.
    const handlers = (
        [
            ['resize', 'full', false],
            ['scroll', 'scroll', true],
            ['click', 'layout', true],
            ['transitionend', 'layout', true]
        ] as const
    ).map(
        ([type, depth, capture]) =>
            [type, () => requestMeasure(depth), capture] as const
    );

    return {
        // The dock now covers `size` pixels of the viewport at its edge.
        reserve(reservation: Reservation) {
            if (!current) {
                root.append(spacer);
                handlers.forEach(([type, handler, capture]) =>
                    view.addEventListener(type, handler, capture)
                );
                doc.body && observer.observe(doc.body);
                Array.from(doc.body?.children ?? []).forEach((child) =>
                    observer.observe(child)
                );
            }

            current = reservation;
            measure('full');
        },
        release() {
            if (!current) {
                return;
            }

            current = undefined;
            spacer.remove();
            observer.disconnect();
            handlers.forEach(([type, handler, capture]) =>
                view.removeEventListener(type, handler, capture)
            );
            padCoveredAreas(undefined);
            restoreRootPadding();
            clearance.release();
        },
        spacer
    };
};

export type DockSpace = ReturnType<typeof createDockSpace>;
