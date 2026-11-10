// Keeps fixed-position page elements out from under the dock: a bar or a
// floating button shifts beside it, a full-width header or full-height
// panel shrinks to end at its edge.

export type DockEdge = 'bottom' | 'left' | 'right';

interface Adjustment {
    // Applied translation and size reduction, in px.
    dx: number;
    dy: number;
    dh: number;
    dw: number;
    inline: { height: string; translate: string; width: string };
}

const NONE: Omit<Adjustment, 'inline'> = { dh: 0, dw: 0, dx: 0, dy: 0 };

const overlaps = (rect: DOMRect, region: DOMRect) =>
    rect.right > region.left + 1 &&
    rect.left < region.right - 1 &&
    rect.bottom > region.top + 1 &&
    rect.top < region.bottom - 1;

// The adjustment that clears `rect` from the dock at `edge`: shift when the
// element fits beside the dock, otherwise shrink it to end at the edge.
const clearanceFor = (
    rect: DOMRect,
    region: DOMRect,
    edge: DockEdge,
    view: Window
): Omit<Adjustment, 'inline'> | undefined => {
    switch (edge) {
        case 'bottom': {
            const overlap = rect.bottom - region.top;

            return rect.top - overlap >= 0
                ? { ...NONE, dy: -overlap }
                : rect.height - overlap > 0
                  ? { ...NONE, dh: overlap }
                  : undefined;
        }
        case 'right': {
            const overlap = rect.right - region.left;

            return rect.left - overlap >= 0
                ? { ...NONE, dx: -overlap }
                : rect.width - overlap > 0
                  ? { ...NONE, dw: overlap }
                  : undefined;
        }
        case 'left': {
            const overlap = region.right - rect.left;

            return rect.right + overlap <= view.innerWidth
                ? { ...NONE, dx: overlap }
                : rect.width - overlap > 0
                  ? { ...NONE, dw: overlap, dx: overlap }
                  : undefined;
        }
    }
};

const sameClearance = (
    first: Omit<Adjustment, 'inline'>,
    second: Omit<Adjustment, 'inline'>
) =>
    Math.round(first.dx) === Math.round(second.dx) &&
    Math.round(first.dy) === Math.round(second.dy) &&
    Math.round(first.dw) === Math.round(second.dw) &&
    Math.round(first.dh) === Math.round(second.dh);

export const createFixedClearance = (
    view: Window,
    // The dock's own nodes, never adjusted.
    ownNodes: () => Element[]
) => {
    const doc = view.document;
    const adjusted = new Map<HTMLElement, Adjustment>();
    // Elements an adjustment could not clear, left alone from then on.
    const unclearable = new WeakSet<HTMLElement>();

    const isFixed = (element: Element) =>
        element instanceof HTMLElement &&
        element.offsetParent === null &&
        getComputedStyle(element).position === 'fixed';
    // The outermost fixed elements overlapping `region`. A fixed element
    // has no offset parent, which rules out most of the page cheaply.
    const fixedUnder = (region: DOMRect) => {
        const own = ownNodes();
        const found = new Set<HTMLElement>();

        doc.body?.querySelectorAll<HTMLElement>('*').forEach((element) => {
            if (
                !isFixed(element) ||
                // A dialog hosting the dock would carry the dock with it.
                own.some(
                    (node) => node.contains(element) || element.contains(node)
                ) ||
                !overlaps(element.getBoundingClientRect(), region)
            ) {
                return;
            }

            let ancestor = element.parentElement;

            while (ancestor && ancestor !== doc.body && !isFixed(ancestor)) {
                ancestor = ancestor.parentElement;
            }

            (!ancestor || ancestor === doc.body) && found.add(element);
        });

        return found;
    };
    // The element's box without our adjustment.
    const naturalRect = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        const entry = adjusted.get(element);

        return entry
            ? new DOMRect(
                  rect.left - entry.dx,
                  rect.top - entry.dy,
                  rect.width + entry.dw,
                  rect.height + entry.dh
              )
            : rect;
    };
    const restore = (element: HTMLElement) => {
        const entry = adjusted.get(element);

        if (entry) {
            Object.assign(element.style, entry.inline);
            adjusted.delete(element);
        }
    };
    const apply = (
        element: HTMLElement,
        rect: DOMRect,
        clearance: Omit<Adjustment, 'inline'>
    ) => {
        const style = getComputedStyle(element);
        const inline = adjusted.get(element)?.inline ?? {
            height: element.style.height,
            translate: element.style.translate,
            width: element.style.width
        };
        // The box sizing decides what `width`/`height` measure.
        const contentBox = style.boxSizing === 'content-box';
        const extraX = contentBox
            ? parseFloat(style.paddingLeft) +
              parseFloat(style.paddingRight) +
              parseFloat(style.borderLeftWidth) +
              parseFloat(style.borderRightWidth)
            : 0;
        const extraY = contentBox
            ? parseFloat(style.paddingTop) +
              parseFloat(style.paddingBottom) +
              parseFloat(style.borderTopWidth) +
              parseFloat(style.borderBottomWidth)
            : 0;

        Object.assign(element.style, inline);
        element.style.translate =
            clearance.dx || clearance.dy
                ? `${clearance.dx}px ${clearance.dy}px`
                : inline.translate;
        clearance.dw &&
            (element.style.width = `${rect.width - clearance.dw - extraX}px`);
        clearance.dh &&
            (element.style.height = `${rect.height - clearance.dh - extraY}px`);
        adjusted.set(element, { ...clearance, inline });
    };

    return {
        // Clears every fixed element the dock's `region` covers, re-checking
        // those already adjusted; `remeasure` re-reads their natural size.
        clear(region: DOMRect, edge: DockEdge, remeasure = false) {
            remeasure && Array.from(adjusted.keys()).forEach(restore);

            const candidates = new Set([
                ...adjusted.keys(),
                ...fixedUnder(region)
            ]);

            candidates.forEach((element) => {
                const rect = naturalRect(element);

                if (
                    !element.isConnected ||
                    unclearable.has(element) ||
                    !overlaps(rect, region)
                ) {
                    restore(element);
                    return;
                }

                const clearance = clearanceFor(rect, region, edge, view);
                const current = adjusted.get(element);

                if (current && clearance && sameClearance(current, clearance)) {
                    return;
                }

                // An element already translated by the page is left alone.
                if (
                    !clearance ||
                    (!current && getComputedStyle(element).translate !== 'none')
                ) {
                    unclearable.add(element);
                    restore(element);
                    return;
                }

                apply(element, rect, clearance);
                overlaps(element.getBoundingClientRect(), region) &&
                    (restore(element), unclearable.add(element));
            });
        },
        release() {
            Array.from(adjusted.keys()).forEach(restore);
        }
    };
};

export type FixedClearance = ReturnType<typeof createFixedClearance>;
