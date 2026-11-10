// The backend's drawing surface in the inspected page: hover and selection
// outlines, render flashes, edge indicators and the element picker. Plain
// DOM in a closed shadow root outside every app root, so the tree walk
// never sees it and app styles never reach it.
import {
    type ComponentContextPartial,
    findOwnerContext
} from '@loom-js/core/devtools';

import { moveInto } from './move-into';

const LAYER_STYLE = `
:host { all: initial; }
.box {
    position: fixed;
    pointer-events: none;
    box-sizing: border-box;
    z-index: 2147483644;
}
.hover { background: rgb(109 40 217 / 0.15); outline: 1px solid rgb(109 40 217 / 0.9); outline-offset: -1px; }
.selected { outline: 2px solid rgb(109 40 217); outline-offset: -2px; }
.flash { outline: 2px solid rgb(14 116 144); outline-offset: -2px; animation: fade 600ms ease-out forwards; }
.label, .edge {
    position: fixed;
    z-index: 2147483644;
    font: 600 11px/1.6 ui-monospace, monospace;
    color: #fff;
    background: rgb(109 40 217);
    padding: 0 4px;
    border-radius: 2px;
    white-space: nowrap;
}
.label { pointer-events: none; }
.edge { cursor: pointer; box-shadow: 0 1px 4px rgb(0 0 0 / 0.4); }
@keyframes fade { to { opacity: 0; } }
`;
const LABEL_HEIGHT = 18;
const EDGE_GAP = 4;
const REDRAW_FALLBACK_MS = 100;

const firstElementOf = (ctx: ComponentContextPartial) => {
    const node = Array.isArray(ctx.root) ? ctx.root[0] : ctx.root;

    return node?.nodeType === 1 ? (node as Element) : node?.parentElement;
};

// The viewport rectangle around a context's rendered nodes.
const boundsOf = (ctx: ComponentContextPartial): DOMRect | undefined => {
    const roots = Array.isArray(ctx.root)
        ? ctx.root
        : ctx.root
          ? [ctx.root]
          : [];
    const rects = roots
        .flatMap((node) => {
            if (node.nodeType === 1) {
                return [(node as Element).getBoundingClientRect()];
            }

            const range = node.ownerDocument!.createRange();

            range.selectNode(node);

            return [range.getBoundingClientRect()];
        })
        .filter(({ height, width }) => width || height);

    if (!rects.length) {
        return undefined;
    }

    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));

    return new DOMRect(left, top, right - left, bottom - top);
};

const intersect = (rect: DOMRect | undefined, area: DOMRect) => {
    if (!rect) {
        return undefined;
    }

    const left = Math.max(rect.left, area.left);
    const top = Math.max(rect.top, area.top);
    const right = Math.min(rect.right, area.right);
    const bottom = Math.min(rect.bottom, area.bottom);

    return right > left && bottom > top
        ? new DOMRect(left, top, right - left, bottom - top)
        : undefined;
};

// The part of `area` an element's scrolling and clipping ancestors leave
// open, or `undefined` when they hide all of it.
const clipRegionOf = (element: Element | null | undefined, area: DOMRect) => {
    let region: DOMRect | undefined = area;
    let ancestor = element?.parentElement;

    while (region && ancestor && ancestor !== ancestor.ownerDocument.body) {
        const { overflowX, overflowY } = getComputedStyle(ancestor);

        (overflowX !== 'visible' || overflowY !== 'visible') &&
            (region = intersect(region, ancestor.getBoundingClientRect()));
        ancestor = ancestor.parentElement;
    }

    return region;
};

// Where an instance outside the visible area lies, relative to it.
const directionOf = (rect: DOMRect, area: DOMRect) =>
    rect.top >= area.bottom
        ? 'down'
        : rect.bottom <= area.top
          ? 'up'
          : rect.left >= area.right
            ? 'right'
            : 'left';
const ARROWS = { down: '↓', left: '←', right: '→', up: '↑' };

// The elements drawn for one outlined instance.
interface Mark {
    box?: HTMLElement;
    edge?: HTMLElement;
    label?: HTMLElement;
}

export interface PickerCallbacks {
    // The owner under the pointer changed.
    hover(ctx: ComponentContextPartial | undefined): void;
    // The user clicked an owner (or pressed Escape, with `undefined`).
    pick(ctx: ComponentContextPartial | undefined): void;
}

export interface PageLayerOptions {
    // The selection came into full view, or left it.
    onSelectionView?(inView: boolean): void;
    // The page area outlines may draw in; defaults to the whole viewport.
    visibleArea?(): DOMRect;
}

export const createPageLayer = (
    doc: Document,
    nameOf: (ctx: ComponentContextPartial) => string,
    { onSelectionView, visibleArea }: PageLayerOptions = {}
) => {
    const view = doc.defaultView!;
    const host = doc.createElement('loom-devtools-layer');
    const shadow = host.attachShadow({ mode: 'closed' });
    const style = doc.createElement('style');
    const marks: Record<'hover' | 'selected', Mark> = {
        hover: {},
        selected: {}
    };
    let hovered: ComponentContextPartial | undefined;
    let selected: ComponentContextPartial | undefined;
    let selectionInView: boolean | undefined;
    let redrawRequested = false;
    let stopPicking: (() => void) | undefined;

    style.textContent = LAYER_STYLE;
    shadow.append(style);
    doc.documentElement.append(host);

    const areaNow = () =>
        visibleArea?.() ?? new DOMRect(0, 0, view.innerWidth, view.innerHeight);
    // The showing part of an instance: inside the visible area and its
    // clipping ancestors.
    const regionOf = (ctx: ComponentContextPartial) =>
        clipRegionOf(firstElementOf(ctx), areaNow());
    const visibleRectOf = (ctx: ComponentContextPartial, rect: DOMRect) =>
        intersect(rect, regionOf(ctx) ?? new DOMRect());
    // In view: wholly showing, or filling the visible area's height.
    const isInView = (ctx: ComponentContextPartial) => {
        const rect = boundsOf(ctx);
        const visible = rect && visibleRectOf(ctx, rect);

        return (
            !!visible &&
            (visible.height >= rect.height - 1 ||
                visible.height >= (regionOf(ctx)?.height ?? 0) - 1)
        );
    };
    // Scrolls an instance into view, unless it already is: scrolling to a
    // sticky or fixed instance would move the page under it every time.
    const reveal = (ctx: ComponentContextPartial) => {
        isInView(ctx) ||
            firstElementOf(ctx)?.scrollIntoView({
                block: 'center',
                inline: 'nearest'
            });
    };
    const reportSelectionView = () => {
        const inView = !!selected && isInView(selected);

        inView !== selectionInView &&
            ((selectionInView = inView), onSelectionView?.(inView));
    };
    const place = (element: HTMLElement, rect: DOMRect) => {
        Object.assign(element.style, {
            height: `${rect.height}px`,
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`
        });
    };
    const attach = (
        existing: HTMLElement | undefined,
        className: string
    ): HTMLElement => {
        const element = existing ?? doc.createElement('div');

        element.className = className;
        element.isConnected || shadow.append(element);

        return element;
    };
    const drop = (element: HTMLElement | undefined) => {
        element?.remove();
        return undefined;
    };
    // An indicator at the visible area's nearest edge, pointing at an
    // instance outside it; clicking it scrolls the instance into view.
    const drawEdge = (
        mark: Mark,
        ctx: ComponentContextPartial,
        rect: DOMRect,
        area: DOMRect
    ) => {
        const direction = directionOf(rect, area);
        const edge = attach(mark.edge, 'edge');

        edge.textContent = `${ARROWS[direction]} ${nameOf(ctx)}`;
        edge.onclick = (event) => {
            event.stopPropagation();
            reveal(ctx);
        };

        const { height, width } = edge.getBoundingClientRect();
        const clampX = (x: number) =>
            Math.max(
                area.left + EDGE_GAP,
                Math.min(x, area.right - width - EDGE_GAP)
            );
        const clampY = (y: number) =>
            Math.max(
                area.top + EDGE_GAP,
                Math.min(y, area.bottom - height - EDGE_GAP)
            );
        const position = {
            down: [clampX(rect.left), area.bottom - height - EDGE_GAP],
            left: [area.left + EDGE_GAP, clampY(rect.top)],
            right: [area.right - width - EDGE_GAP, clampY(rect.top)],
            up: [clampX(rect.left), area.top + EDGE_GAP]
        }[direction];

        edge.style.left = `${position[0]}px`;
        edge.style.top = `${position[1]}px`;
        mark.edge = edge;
    };
    // Outlines the visible part of an instance, labels it when asked, and
    // points at it from the edge when none of it is visible.
    const drawMark = (
        mark: Mark,
        className: string,
        ctx: ComponentContextPartial | undefined,
        withLabel: boolean
    ) => {
        const rect = ctx && boundsOf(ctx);

        if (!ctx || !rect) {
            mark.box = drop(mark.box);
            mark.label = drop(mark.label);
            mark.edge = drop(mark.edge);
            return;
        }

        // A hidden instance is pointed at from its scroll area's edge.
        const area = regionOf(ctx) ?? areaNow();
        const visible = visibleRectOf(ctx, rect);

        if (!visible) {
            mark.box = drop(mark.box);
            mark.label = drop(mark.label);
            drawEdge(mark, ctx, rect, area);
            return;
        }

        mark.edge = drop(mark.edge);
        mark.box = attach(mark.box, `box ${className}`);
        place(mark.box, visible);

        if (!withLabel) {
            mark.label = drop(mark.label);
            return;
        }

        mark.label = attach(mark.label, 'label');
        mark.label.textContent = nameOf(ctx);
        Object.assign(mark.label.style, {
            left: `${visible.left}px`,
            top: `${Math.max(visible.top - LABEL_HEIGHT, area.top)}px`
        });
    };
    const redraw = () => {
        redrawRequested = false;
        drawMark(marks.hover, 'hover', hovered, true);
        drawMark(marks.selected, 'selected', selected, false);
        reportSelectionView();
    };
    // Keeps outlines on their instances through scrolls and resizes, once
    // per frame; the timer covers pages whose frames are paused.
    const requestRedraw = () => {
        if (!redrawRequested && (hovered || selected)) {
            redrawRequested = true;

            const redrawOnce = () => redrawRequested && redraw();

            view.requestAnimationFrame(redrawOnce);
            view.setTimeout(redrawOnce, REDRAW_FALLBACK_MS);
        }
    };
    const showHover = (ctx: ComponentContextPartial | undefined) => {
        hovered = ctx;
        drawMark(marks.hover, 'hover', hovered, true);
    };

    view.addEventListener('scroll', requestRedraw, true);
    view.addEventListener('resize', requestRedraw);

    return {
        destroy() {
            stopPicking?.();
            view.removeEventListener('scroll', requestRedraw, true);
            view.removeEventListener('resize', requestRedraw);
            host.remove();
        },
        // Flashes stay inside the visible area and never point from an edge.
        flash(ctx: ComponentContextPartial) {
            const rect = boundsOf(ctx);
            const visible = rect && visibleRectOf(ctx, rect);

            if (!visible) {
                return;
            }

            const box = attach(undefined, 'box flash');

            place(box, visible);
            box.addEventListener('animationend', () => box.remove(), {
                once: true
            });
        },
        hover: showHover,
        // Moves the layer into `target`, e.g. an open modal dialog.
        moveTo: (target: Element) => moveInto(target, host),
        redraw,
        reveal,
        selectionInView: () => !!selected && isInView(selected),
        select(ctx: ComponentContextPartial | undefined) {
            selected = ctx;
            drawMark(marks.selected, 'selected', selected, false);
            reportSelectionView();
        },
        // Outlines the owner under the pointer; a click selects it and never
        // reaches the app. Escape cancels.
        startPicking({ hover, pick }: PickerCallbacks) {
            stopPicking?.();

            const ownerAt = (event: Event) => {
                const target = event.composedPath()[0];

                return target instanceof Node
                    ? findOwnerContext(target)
                    : undefined;
            };
            const swallow = (event: Event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
            };
            const onMove = (event: Event) => {
                const ctx = ownerAt(event);

                showHover(ctx);
                hover(ctx);
            };
            const onClick = (event: Event) => {
                swallow(event);
                finish(ownerAt(event));
            };
            const onKey = (event: KeyboardEvent) => {
                event.key === 'Escape' && (swallow(event), finish(undefined));
            };
            const swallowed = [
                'pointerdown',
                'mousedown',
                'pointerup',
                'mouseup'
            ];
            const finish = (ctx: ComponentContextPartial | undefined) => {
                stopPicking?.();
                pick(ctx);
            };

            view.addEventListener('pointermove', onMove, true);
            view.addEventListener('click', onClick, true);
            view.addEventListener('keydown', onKey, true);
            swallowed.forEach((type) =>
                view.addEventListener(type, swallow, true)
            );
            stopPicking = () => {
                stopPicking = undefined;
                view.removeEventListener('pointermove', onMove, true);
                view.removeEventListener('click', onClick, true);
                view.removeEventListener('keydown', onKey, true);
                swallowed.forEach((type) =>
                    view.removeEventListener(type, swallow, true)
                );
                showHover(undefined);
            };
        },
        stopPicking() {
            stopPicking?.();
        }
    };
};

export type PageLayer = ReturnType<typeof createPageLayer>;
