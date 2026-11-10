// Where the HUD runs: a frame in the page, docked at an edge or floating
// over it. The frame loads the prebuilt frontend document, so the HUD never
// shares the page's core instance, styles or component tree.
import { frontendDocument } from '../frontend-source';
import { LOGO_CIRCLES, LOGO_VIEW_BOX } from '../logo';
import type {
    DockPosition,
    DockSize,
    DockState,
    Placement
} from '../protocol/types';
import { createDockSpace } from './dock-space';
import {
    type DockSettings,
    type FloatEdge,
    clampFloat,
    clampHeight,
    clampWidth,
    readDockSettings,
    resizeFloat,
    resolveDock,
    shownSize,
    writeDockSettings
} from './dock-state';
import { moveInto } from './move-into';
import { trackPointer } from './pointer-drag';

export const HUD_ROOT_ID = 'loom-devtools-hud';
const HANDLE_SIZE = 6;
// The floating window's drag bar, and the edges and corners that resize it.
export const GRIP_SIZE = 16;
const EDGE_SIZE = 6;
const CORNER_SIZE = 12;
const EDGE_CURSORS: Record<FloatEdge, string> = {
    e: 'ew-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    nw: 'nwse-resize',
    s: 'ns-resize',
    se: 'nwse-resize',
    sw: 'nesw-resize',
    w: 'ew-resize'
};
const BUBBLE_SIZE = 36;
const LOGO_INSET = 7;
// The minimized button's distance from the viewport's bottom corner.
const BUBBLE_INSET = 16;
const ACCENT = '#6d28d9';
const ACCENT_BORDER = `2px solid ${ACCENT}`;
const FLOAT_BORDER = `1px solid ${ACCENT}`;
const FLOAT_SHADOW = '0 12px 32px rgba(0, 0, 0, 0.45)';

const DOCK_STYLE = {
    background: '#19191c',
    border: '0',
    boxSizing: 'border-box',
    position: 'fixed',
    zIndex: '2147483645'
};
const HANDLE_STYLE = {
    position: 'fixed',
    touchAction: 'none',
    zIndex: '2147483646'
};
const GRIP_STYLE = {
    ...HANDLE_STYLE,
    alignItems: 'center',
    background: '#232328',
    border: FLOAT_BORDER,
    borderBottom: '0',
    borderRadius: '8px 8px 0 0',
    boxSizing: 'border-box',
    cursor: 'move',
    display: 'flex',
    justifyContent: 'center'
};
const GRIP_PILL_STYLE = {
    background: '#6b6b76',
    borderRadius: '2px',
    height: '4px',
    width: '32px'
};
const BUBBLE_STYLE = {
    ...HANDLE_STYLE,
    alignItems: 'center',
    background: '#19191c',
    border: FLOAT_BORDER,
    borderRadius: '50%',
    boxShadow: FLOAT_SHADOW,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    justifyContent: 'center',
    padding: '0'
};
// The snap into a corner after a drag.
const BUBBLE_SNAP = 'left 160ms ease-out, top 160ms ease-out';
// Every inline property the layouts set, cleared before each one.
const LAYOUT_PROPERTIES = [
    'borderBottom',
    'borderLeft',
    'borderRadius',
    'borderRight',
    'borderTop',
    'bottom',
    'boxShadow',
    'cursor',
    'display',
    'height',
    'left',
    'right',
    'top',
    'transition',
    'width'
] as const;

export interface HostOptions {
    // The HUD opened, closed, moved or resized.
    onLayout?(): void;
}

// The minimized button's face: the loom mark.
const fillBubble = (doc: Document, bubble: HTMLElement) => {
    const svgNs = 'http://www.w3.org/2000/svg';
    const logo = doc.createElementNS(svgNs, 'svg');

    logo.setAttribute('aria-hidden', 'true');
    logo.setAttribute('height', String(BUBBLE_SIZE - LOGO_INSET * 2));
    logo.setAttribute('viewBox', LOGO_VIEW_BOX);
    logo.setAttribute('width', String(BUBBLE_SIZE - LOGO_INSET * 2));
    LOGO_CIRCLES.forEach(([cx, cy, radius, fill]) => {
        const circle = logo.appendChild(doc.createElementNS(svgNs, 'circle'));

        circle.setAttribute('cx', String(cx));
        circle.setAttribute('cy', String(cy));
        circle.setAttribute('fill', fill);
        circle.setAttribute('r', String(radius));
    });
    bubble.append(logo);
};

export const createHosts = (view: Window, { onLayout }: HostOptions = {}) => {
    const doc = view.document;
    const settings: DockSettings = readDockSettings(view);
    const save = () => writeDockSettings(view, settings);
    // The bottom corner the minimized button sits in: the right whenever it
    // appears, the nearer one after a drag.
    let bubbleSide: 'left' | 'right' = 'right';
    const reducedMotion = !!view.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
    ).matches;
    let dock: HTMLIFrameElement | undefined;
    let handle: HTMLElement | undefined;
    let grip: HTMLElement | undefined;
    let bubble: HTMLButtonElement | undefined;
    const edges = new Map<FloatEdge, HTMLElement>();
    // Where the HUD's nodes live: the document, or the open modal dialog
    // they follow so they stay above it and interactive.
    let parent: Element = doc.documentElement;
    const ownNodes = () =>
        [dock, handle, grip, bubble, ...edges.values()].filter(
            (node): node is HTMLElement => !!node
        );
    const space = createDockSpace(view, ownNodes);

    const stateNow = () => resolveDock(view, settings);
    // Each node's own look, re-applied under every layout.
    const baseStyles = new WeakMap<HTMLElement, Record<string, string>>();
    const create = <Tag extends 'button' | 'div' | 'iframe'>(
        tag: Tag,
        base: Record<string, string>
    ) => {
        const element = doc.createElement(tag);

        baseStyles.set(element, base);
        Object.assign(element.style, base);
        return element;
    };
    const place = (element: HTMLElement, style: Record<string, string>) => {
        LAYOUT_PROPERTIES.forEach((property) => (element.style[property] = ''));
        Object.assign(element.style, baseStyles.get(element), style);
    };
    const hide = (element: HTMLElement) => place(element, { display: 'none' });

    // Lays the frame and handle out at the dock's edge and reserves the same
    // space in the page, so nothing stays under the dock.
    const layoutDocked = (state: DockState) => {
        const size = shownSize(view, state);
        const atSide = state.edge === 'side';
        const side = state.side;
        const inner = side === 'right' ? 'left' : 'right';

        place(
            dock!,
            atSide
                ? {
                      [`border${inner === 'left' ? 'Left' : 'Right'}`]:
                          ACCENT_BORDER,
                      height: '100%',
                      [side]: '0',
                      top: '0',
                      width: `${size}px`
                  }
                : {
                      borderTop: ACCENT_BORDER,
                      bottom: '0',
                      height: `${size}px`,
                      left: '0',
                      width: '100%'
                  }
        );
        place(
            handle!,
            atSide
                ? {
                      cursor: 'ew-resize',
                      height: '100%',
                      [side]: `${size - HANDLE_SIZE / 2}px`,
                      top: '0',
                      width: `${HANDLE_SIZE}px`
                  }
                : {
                      bottom: `${size - HANDLE_SIZE / 2}px`,
                      cursor: 'ns-resize',
                      height: `${HANDLE_SIZE}px`,
                      left: '0',
                      width: '100%'
                  }
        );
        state.collapsed && hide(handle!);
        [grip!, bubble!, ...edges.values()].forEach(hide);
        space.reserve({
            edge: state.edge === 'side' ? 'side' : 'bottom',
            side,
            size
        });
    };
    // Floats the frame over the page under its drag bar, or shows only the
    // minimized button. A floating HUD reserves no page space.
    // Sits the minimized button in its bottom corner, inset from the edges.
    const placeBubble = () => {
        place(bubble!, {
            height: `${BUBBLE_SIZE}px`,
            width: `${BUBBLE_SIZE}px`
        });
        place(bubble!, {
            height: `${BUBBLE_SIZE}px`,
            width: `${BUBBLE_SIZE}px`,
            left: `${
                bubbleSide === 'left'
                    ? BUBBLE_INSET
                    : Math.round(
                          view.innerWidth -
                              bubble!.getBoundingClientRect().width -
                              BUBBLE_INSET
                      )
            }px`,
            top: `${view.innerHeight - BUBBLE_SIZE - BUBBLE_INSET}px`,
            transition: reducedMotion ? 'none' : BUBBLE_SNAP
        });
    };
    const layoutFloating = ({ collapsed, float }: DockState) => {
        const { height, width, x, y } = float;

        space.release();

        hide(handle!);

        if (collapsed) {
            [dock!, grip!, ...edges.values()].forEach(hide);
            placeBubble();
            return;
        }

        hide(bubble!);
        place(grip!, {
            height: `${GRIP_SIZE}px`,
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`
        });
        place(dock!, {
            borderBottom: FLOAT_BORDER,
            borderLeft: FLOAT_BORDER,
            borderRadius: '0 0 8px 8px',
            borderRight: FLOAT_BORDER,
            boxShadow: FLOAT_SHADOW,
            height: `${height - GRIP_SIZE}px`,
            left: `${x}px`,
            top: `${y + GRIP_SIZE}px`,
            width: `${width}px`
        });
        // Edges straddle the border; corners sit over its ends.
        const half = EDGE_SIZE / 2;
        const right = x + width;
        const bottom = y + height;
        const spanX = width - CORNER_SIZE * 2;
        const spanY = height - CORNER_SIZE * 2;
        const corner = CORNER_SIZE - half;
        const zones: Record<FloatEdge, [number, number, number, number]> = {
            e: [right - half, y + CORNER_SIZE, EDGE_SIZE, spanY],
            n: [x + CORNER_SIZE, y - half, spanX, EDGE_SIZE],
            ne: [right - corner, y - half, CORNER_SIZE, CORNER_SIZE],
            nw: [x - half, y - half, CORNER_SIZE, CORNER_SIZE],
            s: [x + CORNER_SIZE, bottom - half, spanX, EDGE_SIZE],
            se: [right - corner, bottom - corner, CORNER_SIZE, CORNER_SIZE],
            sw: [x - half, bottom - corner, CORNER_SIZE, CORNER_SIZE],
            w: [x - half, y + CORNER_SIZE, EDGE_SIZE, spanY]
        };

        edges.forEach((element, edge) => {
            const [left, top, zoneWidth, zoneHeight] = zones[edge];

            place(element, {
                cursor: EDGE_CURSORS[edge],
                height: `${zoneHeight}px`,
                left: `${left}px`,
                top: `${top}px`,
                width: `${zoneWidth}px`
            });
        });
    };
    // `quiet` skips the change report, for the moves of a drag in progress.
    const layout = (quiet = false) => {
        if (!dock) {
            return;
        }

        const state = stateNow();

        state.edge === 'float' ? layoutFloating(state) : layoutDocked(state);
        quiet || onLayout?.();
    };

    const settle = (moved: boolean) => {
        moved && save();
        layout();
    };
    // Restores a minimized window where it was last expanded.
    const restore = () => {
        settings.collapsed = false;
        settings.float = clampFloat(view, settings.float);
        settle(true);
    };
    // Moves the floating window by its drag bar.
    const startMove = (event: PointerEvent) => {
        event.preventDefault();

        const origin = { ...settings.float };

        trackPointer(
            grip!,
            event,
            (dx, dy) => {
                settings.float = clampFloat(view, {
                    ...origin,
                    x: origin.x + dx,
                    y: origin.y + dy
                });
                layout(true);
            },
            settle
        );
    };
    // The minimized button follows the pointer, then snaps into the bottom
    // corner nearer where it was let go; a press that never moved restores.
    const startBubbleDrag = (event: PointerEvent) => {
        event.preventDefault();

        const { left, top, width } = bubble!.getBoundingClientRect();
        const keepInView = (position: number, size: number, room: number) =>
            Math.round(Math.max(0, Math.min(position, room - size)));

        trackPointer(
            bubble!,
            event,
            (dx, dy) =>
                place(bubble!, {
                    height: `${BUBBLE_SIZE}px`,
                    width: `${BUBBLE_SIZE}px`,
                    left: `${keepInView(left + dx, width, view.innerWidth)}px`,
                    top: `${keepInView(top + dy, BUBBLE_SIZE, view.innerHeight)}px`,
                    transition: 'none'
                }),
            (moved) => {
                if (!moved) {
                    restore();
                    return;
                }

                const center = bubble!.getBoundingClientRect();

                bubbleSide =
                    center.left + center.width / 2 < view.innerWidth / 2
                        ? 'left'
                        : 'right';
                layout();
            }
        );
    };
    // Resizes the dock from its inner edge.
    const startResize = (event: PointerEvent) => {
        event.preventDefault();
        trackPointer(
            handle!,
            event,
            (_dx, _dy, move) => {
                const { edge, side } = stateNow();

                edge === 'side'
                    ? (settings.width = clampWidth(
                          view,
                          side === 'right'
                              ? view.innerWidth - move.clientX
                              : move.clientX
                      ))
                    : (settings.height = clampHeight(
                          view,
                          view.innerHeight - move.clientY
                      ));
                layout();
            },
            settle
        );
    };
    // Resizes the floating window from one of its edges or corners.
    const startEdgeResize = (edge: FloatEdge) => (event: PointerEvent) => {
        event.preventDefault();

        const origin = { ...settings.float };

        trackPointer(
            edges.get(edge)!,
            event,
            (dx, dy) => {
                settings.float = resizeFloat(view, origin, edge, dx, dy);
                layout(true);
            },
            settle
        );
    };
    // An automatic dock re-picks its edge as the window resizes; a floating
    // window stays inside it.
    let edgeShown: DockState['edge'] | undefined;
    const onWindowResize = () => {
        const { edge } = stateNow();

        if (edge === 'float') {
            settings.float = clampFloat(view, settings.float);
            layout();
            return;
        }

        edge !== edgeShown && ((edgeShown = edge), layout());
    };

    const closeHud = () => {
        if (!dock) {
            return;
        }

        ownNodes().forEach((node) => node.remove());
        dock = undefined;
        handle = undefined;
        grip = undefined;
        bubble = undefined;
        edges.clear();
        edgeShown = undefined;
        view.removeEventListener('resize', onWindowResize);
        space.release();
        onLayout?.();
    };
    const openHud = () => {
        if (dock) {
            return;
        }

        dock = create('iframe', DOCK_STYLE);
        dock.title = 'loom devtools';
        dock.srcdoc = frontendDocument();
        handle = create('div', HANDLE_STYLE);
        handle.title = 'Drag to resize devtools';
        handle.addEventListener('pointerdown', startResize);
        grip = create('div', GRIP_STYLE);
        grip.title = 'Drag to move devtools';
        Object.assign(
            grip.appendChild(doc.createElement('span')).style,
            GRIP_PILL_STYLE
        );
        grip.addEventListener('pointerdown', startMove);
        bubble = create('button', BUBBLE_STYLE);
        bubble.type = 'button';
        fillBubble(doc, bubble);
        bubble.title = 'Expand devtools (drag to move)';
        bubble.setAttribute('aria-label', 'Expand devtools');
        bubble.addEventListener('pointerdown', startBubbleDrag);
        // Keyboard presses arrive as clicks with no pointer down first.
        bubble.addEventListener(
            'click',
            (event) => event.detail === 0 && restore()
        );
        (Object.keys(EDGE_CURSORS) as FloatEdge[]).forEach((edge) => {
            const element = create('div', HANDLE_STYLE);

            element.title = 'Drag to resize devtools';
            element.dataset.edge = edge;
            element.addEventListener('pointerdown', startEdgeResize(edge));
            edges.set(edge, element);
        });
        parent.append(dock, handle, grip, ...edges.values(), bubble);
        edgeShown = stateNow().edge;
        view.addEventListener('resize', onWindowResize);
        layout();
    };

    return {
        close: closeHud,
        dockState: stateNow,
        // Moves the HUD into `target`, keeping the frame's document alive
        // where the browser can.
        moveTo(target: Element) {
            parent = target;
            ownNodes().forEach((node) => moveInto(target, node));
        },
        // The backend's own HUD frame.
        isPeer(source: Window) {
            return source === dock?.contentWindow;
        },
        // Opens the HUD docked or floating; without a placement, as it was.
        open(placement?: Placement) {
            placement && (settings.floating = placement === 'float');
            // The viewport may have shrunk while the window was docked.
            settings.float = clampFloat(view, settings.float);
            save();

            if (!dock) {
                openHud();
                return;
            }

            edgeShown = stateNow().edge;
            layout();
        },
        // Docks at `position`; `bottom` or `side` holds until `auto` again.
        placeDock(position: DockPosition): DockState {
            settings.position = position;
            settings.floating = false;
            save();
            edgeShown = stateNow().edge;
            layout();

            return stateNow();
        },
        resizeDock({ collapsed, height, width }: DockSize): DockState {
            collapsed !== undefined && (settings.collapsed = collapsed);
            collapsed && (bubbleSide = 'right');
            height !== undefined &&
                (settings.height = clampHeight(view, height));
            width !== undefined && (settings.width = clampWidth(view, width));
            save();
            layout();

            return stateNow();
        },
        // The page area not covered by a docked HUD, in viewport coordinates.
        // A floating window covers no fixed area: it moves out of the way.
        visibleArea() {
            const width = doc.documentElement.clientWidth || view.innerWidth;
            const rect = dock?.getBoundingClientRect();
            const { edge } = stateNow();

            if (!rect || edge === 'float') {
                return new DOMRect(0, 0, width, view.innerHeight);
            }

            return edge === 'bottom'
                ? new DOMRect(0, 0, width, Math.min(rect.top, view.innerHeight))
                : rect.left > 0
                  ? new DOMRect(
                        0,
                        0,
                        Math.min(rect.left, width),
                        view.innerHeight
                    )
                  : new DOMRect(
                        rect.right,
                        0,
                        Math.max(0, width - rect.right),
                        view.innerHeight
                    );
        }
    };
};

export type Hosts = ReturnType<typeof createHosts>;
