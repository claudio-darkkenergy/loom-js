// The backend's drawing surface in the inspected page: hover and selection
// outlines, render flashes and the element picker. Plain DOM in a closed
// shadow root outside every app root, so the tree walk never sees it and
// app styles never reach it.
import {
    type ComponentContextPartial,
    findOwnerContext
} from '@loom-js/core/devtools';

const LAYER_STYLE = `
:host { all: initial; }
.box {
    position: fixed;
    pointer-events: none;
    box-sizing: border-box;
    z-index: 2147483646;
}
.hover { background: rgb(109 40 217 / 0.15); outline: 1px solid rgb(109 40 217 / 0.9); }
.selected { outline: 2px solid rgb(109 40 217); }
.flash { outline: 2px solid rgb(14 116 144); animation: fade 600ms ease-out forwards; }
.label {
    position: fixed;
    pointer-events: none;
    z-index: 2147483647;
    font: 600 11px/1.6 ui-monospace, monospace;
    color: #fff;
    background: rgb(109 40 217);
    padding: 0 4px;
    border-radius: 2px;
}
@keyframes fade { to { opacity: 0; } }
`;

// The page-space rectangle around a context's rendered nodes.
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

export interface PickerCallbacks {
    // The owner under the pointer changed.
    hover(ctx: ComponentContextPartial | undefined): void;
    // The user clicked an owner (or pressed Escape, with `undefined`).
    pick(ctx: ComponentContextPartial | undefined): void;
}

export const createPageLayer = (
    doc: Document,
    nameOf: (ctx: ComponentContextPartial) => string
) => {
    const host = doc.createElement('loom-devtools-layer');
    const shadow = host.attachShadow({ mode: 'closed' });
    const style = doc.createElement('style');
    let hoverBox: HTMLElement | undefined;
    let selectedBox: HTMLElement | undefined;
    let label: HTMLElement | undefined;
    let selected: ComponentContextPartial | undefined;
    let stopPicking: (() => void) | undefined;

    style.textContent = LAYER_STYLE;
    shadow.append(style);
    doc.documentElement.append(host);

    const place = (box: HTMLElement, rect: DOMRect) => {
        Object.assign(box.style, {
            height: `${rect.height}px`,
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`
        });
    };
    const drawBox = (
        existing: HTMLElement | undefined,
        className: string,
        ctx: ComponentContextPartial | undefined
    ) => {
        const rect = ctx && boundsOf(ctx);

        if (!rect) {
            existing?.remove();
            return undefined;
        }

        const box = existing ?? doc.createElement('div');

        box.className = `box ${className}`;
        place(box, rect);
        box.isConnected || shadow.append(box);

        return box;
    };
    const showHover = (ctx: ComponentContextPartial | undefined) => {
        hoverBox = drawBox(hoverBox, 'hover', ctx);

        const rect = ctx && hoverBox && boundsOf(ctx);

        if (!ctx || !rect) {
            label?.remove();
            label = undefined;
            return;
        }

        label ??= doc.createElement('div');
        label.className = 'label';
        label.textContent = nameOf(ctx);
        Object.assign(label.style, {
            left: `${rect.left}px`,
            top: `${Math.max(rect.top - 18, 0)}px`
        });
        label.isConnected || shadow.append(label);
    };
    // Keeps the selection outline on its instance through scrolls/resizes.
    const redrawSelection = () => {
        selectedBox = drawBox(selectedBox, 'selected', selected);
    };
    const view = doc.defaultView!;

    view.addEventListener('scroll', redrawSelection, true);
    view.addEventListener('resize', redrawSelection);

    return {
        destroy() {
            stopPicking?.();
            view.removeEventListener('scroll', redrawSelection, true);
            view.removeEventListener('resize', redrawSelection);
            host.remove();
        },
        flash(ctx: ComponentContextPartial) {
            const box = drawBox(undefined, 'flash', ctx);

            box?.addEventListener('animationend', () => box.remove(), {
                once: true
            });
        },
        hover: showHover,
        select(ctx: ComponentContextPartial | undefined) {
            selected = ctx;
            redrawSelection();
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
