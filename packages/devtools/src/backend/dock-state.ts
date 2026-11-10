// The dock's settings and the state they resolve to: which edge it sits
// at, its size there, and what persists across reloads.
import type { DockPosition, DockState, FloatRect } from '../protocol/types';

const DOCK_STORAGE_KEY = 'loom-devtools:dock';
// The floating HUD's own settings: its window.
const HUD_STORAGE_KEY = 'loom-devtools:hud';
// A collapsed dock keeps only its toolbar, or a strip at the side.
export const COLLAPSED_SIZE = 34;
const MIN_HEIGHT = 120;
const MIN_WIDTH = 280;
const DEFAULT_WIDTH = 400;
// The page always keeps this much of the viewport above the dock.
const MIN_PAGE_HEIGHT = 40;
// An automatic dock moves to the side only while this much page is left
// beside it.
export const MIN_SIDE_PAGE_WIDTH = 600;
const MIN_FLOAT_WIDTH = 320;
const MIN_FLOAT_HEIGHT = 200;
const DEFAULT_FLOAT_WIDTH = 720;
const DEFAULT_FLOAT_HEIGHT = 480;
// A new floating window keeps this far from the viewport's edges.
const FLOAT_INSET = 16;

/** What the user chose; the rest of `DockState` is derived. */
export type DockSettings = Pick<
    DockState,
    'collapsed' | 'float' | 'floating' | 'height' | 'position' | 'width'
>;

// The settings kept under the HUD's key; the rest are the dock's.
const HUD_SETTINGS = ['float'] as const;

// Storage can be missing or throw (private windows, blocked site data).
const readStored = (view: Window, key: string): Partial<DockSettings> => {
    try {
        return JSON.parse(view.localStorage.getItem(key) ?? '{}');
    } catch {
        return {};
    }
};

const POSITIONS: DockPosition[] = ['auto', 'bottom', 'side'];

const isFloatRect = (value: unknown): value is FloatRect =>
    typeof value === 'object' &&
    value !== null &&
    ['height', 'width', 'x', 'y'].every(
        (key) => typeof (value as Record<string, unknown>)[key] === 'number'
    );

/**
 * Keeps a floating window inside the viewport and at least its minimum size.
 * @param view The inspected page's window.
 * @param rect The window's requested rect.
 */
export const clampFloat = (view: Window, rect: FloatRect): FloatRect => {
    const width = Math.round(
        Math.min(view.innerWidth, Math.max(MIN_FLOAT_WIDTH, rect.width))
    );
    const height = Math.round(
        Math.min(view.innerHeight, Math.max(MIN_FLOAT_HEIGHT, rect.height))
    );

    return {
        height,
        width,
        x: Math.round(Math.max(0, Math.min(rect.x, view.innerWidth - width))),
        y: Math.round(Math.max(0, Math.min(rect.y, view.innerHeight - height)))
    };
};

/** An edge or corner of the floating window, by compass direction. */
export type FloatEdge = 'e' | 'n' | 'ne' | 'nw' | 's' | 'se' | 'sw' | 'w';

/**
 * Resizes a floating window by dragging one of its edges or corners: only
 * the dragged sides move, and they stop at the viewport and at the
 * window's minimum size.
 * @param view The inspected page's window.
 * @param rect The window's rect when the drag started.
 * @param edge The dragged edge or corner.
 * @param dx The pointer's horizontal travel.
 * @param dy The pointer's vertical travel.
 */
export const resizeFloat = (
    view: Window,
    rect: FloatRect,
    edge: FloatEdge,
    dx: number,
    dy: number
): FloatRect => {
    const clamp = (value: number, low: number, high: number) =>
        Math.round(Math.max(low, Math.min(value, high)));
    let left = rect.x;
    let top = rect.y;
    let right = rect.x + rect.width;
    let bottom = rect.y + rect.height;

    edge.includes('w') && (left = clamp(left + dx, 0, right - MIN_FLOAT_WIDTH));
    edge.includes('e') &&
        (right = clamp(right + dx, left + MIN_FLOAT_WIDTH, view.innerWidth));
    edge.includes('n') && (top = clamp(top + dy, 0, bottom - MIN_FLOAT_HEIGHT));
    edge.includes('s') &&
        (bottom = clamp(bottom + dy, top + MIN_FLOAT_HEIGHT, view.innerHeight));

    return { height: bottom - top, width: right - left, x: left, y: top };
};

// A new floating window sits at the viewport's bottom-right corner.
const defaultFloat = (view: Window): FloatRect => {
    const width = Math.min(
        DEFAULT_FLOAT_WIDTH,
        view.innerWidth - FLOAT_INSET * 2
    );
    const height = Math.min(
        DEFAULT_FLOAT_HEIGHT,
        view.innerHeight - FLOAT_INSET * 2
    );

    return clampFloat(view, {
        height,
        width,
        x: view.innerWidth - width - FLOAT_INSET,
        y: view.innerHeight - height - FLOAT_INSET
    });
};

export const readDockSettings = (view: Window): DockSettings => {
    const stored = readStored(view, DOCK_STORAGE_KEY);
    const hud = readStored(view, HUD_STORAGE_KEY);

    return {
        collapsed: stored.collapsed === true,
        float: isFloatRect(hud.float)
            ? clampFloat(view, hud.float)
            : defaultFloat(view),
        floating: stored.floating === true,
        height:
            typeof stored.height === 'number'
                ? stored.height
                : Math.round(view.innerHeight * 0.4),
        position: POSITIONS.includes(stored.position!)
            ? stored.position!
            : 'auto',
        width: typeof stored.width === 'number' ? stored.width : DEFAULT_WIDTH
    };
};

export const writeDockSettings = (view: Window, settings: DockSettings) => {
    const dock: Record<string, unknown> = { ...settings };

    HUD_SETTINGS.forEach((key) => delete dock[key]);

    try {
        view.localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(dock));
        view.localStorage.setItem(
            HUD_STORAGE_KEY,
            JSON.stringify(
                Object.fromEntries(
                    HUD_SETTINGS.map((key) => [key, settings[key]])
                )
            )
        );
    } catch {
        // The dock still works; it just won't remember its settings.
    }
};

export const clampHeight = (view: Window, height: number) =>
    Math.round(
        Math.max(
            MIN_HEIGHT,
            Math.min(height, view.innerHeight - MIN_PAGE_HEIGHT)
        )
    );

export const clampWidth = (view: Window, width: number) =>
    Math.round(
        Math.max(
            MIN_WIDTH,
            Math.min(width, view.innerWidth - MIN_SIDE_PAGE_WIDTH)
        )
    );

/**
 * Resolves the settings against the window: the edge, the side (the
 * page's inline end) and the settings themselves.
 * @param view The inspected page's window.
 * @param settings The user's dock settings.
 */
export const resolveDock = (
    view: Window,
    settings: DockSettings
): DockState => {
    const fitsSide =
        view.innerWidth - Math.max(MIN_WIDTH, settings.width) >=
        MIN_SIDE_PAGE_WIDTH;
    const rtl =
        view.getComputedStyle(view.document.documentElement).direction ===
        'rtl';

    return {
        ...settings,
        edge: settings.floating
            ? 'float'
            : settings.position === 'side' ||
                (settings.position === 'auto' && fitsSide)
              ? 'side'
              : 'bottom',
        side: rtl ? 'left' : 'right'
    };
};

/**
 * The dock's extent at its edge: height at the bottom, width at the side.
 * @param view The inspected page's window.
 * @param state The resolved dock state.
 */
export const shownSize = (view: Window, state: DockState) =>
    state.collapsed
        ? COLLAPSED_SIZE
        : state.edge === 'side'
          ? Math.max(MIN_WIDTH, Math.min(state.width, view.innerWidth - 40))
          : clampHeight(view, state.height);
