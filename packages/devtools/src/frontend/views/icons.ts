// Toolbar icons, drawn on a 16px grid in the current text color. Each is
// decorative: its button carries the accessible name.
import { component } from '@loom-js/core';

/** A cursor over a box's open corner, after the browser's element picker. */
export const PickIcon = component(
    (html) => html`
        <svg
            aria-hidden="true"
            class="hud-icon"
            fill="none"
            viewBox="0 0 16 16"
        >
            <path
                d="M7 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5V7"
                stroke="currentColor"
                stroke-width="1.5"
            />
            <path
                d="M8 8l7 2.4-2.8.8 2.5 2.5-1 1-2.5-2.5-.8 2.8z"
                fill="currentColor"
            />
        </svg>
    `,
    { name: 'PickIcon' }
);

/** A bolt inside a dashed outline: the outline a render flashes. */
export const FlashIcon = component(
    (html) => html`
        <svg
            aria-hidden="true"
            class="hud-icon"
            fill="none"
            viewBox="0 0 16 16"
        >
            <rect
                height="12.5"
                rx="1.5"
                stroke="currentColor"
                stroke-dasharray="2.2 1.8"
                stroke-width="1.5"
                width="12.5"
                x="1.75"
                y="1.75"
            />
            <path
                d="M9.2 3.5 5.5 8.8h2.3l-1 3.7 3.7-5.3H8.2z"
                fill="currentColor"
            />
        </svg>
    `,
    { name: 'FlashIcon' }
);

/** Staggered bars, like the rows of a Performance panel track. */
export const PerfIcon = component(
    (html) => html`
        <svg
            aria-hidden="true"
            class="hud-icon"
            fill="currentColor"
            viewBox="0 0 16 16"
        >
            <rect height="2.5" rx="1" width="7" x="1.5" y="2.5" />
            <rect height="2.5" rx="1" width="9.5" x="5" y="6.75" />
            <rect height="2.5" rx="1" width="6" x="3" y="11" />
        </svg>
    `,
    { name: 'PerfIcon' }
);

/** Where a dock icon fills its window: one edge, or both for automatic. */
export type DockIconPanel = 'auto' | 'bottom' | 'left' | 'right';

// A window with the dock's panel filled in. Automatic fills the bottom and
// side panels faintly: it takes whichever fits.
export const DockIcon = component<{
    panel: DockIconPanel;
    side: 'left' | 'right';
}>(
    (html, { panel, side }) => {
        const edge = panel === 'auto' ? side : panel;

        return html`
            <svg
                aria-hidden="true"
                class="hud-icon"
                fill="none"
                viewBox="0 0 16 16"
            >
                <rect
                    fill="currentColor"
                    fill-opacity=${panel === 'auto' ? '0.4' : '1'}
                    height=${edge === 'bottom' ? '4' : '10'}
                    width=${edge === 'bottom' ? '12' : '4.5'}
                    x=${edge === 'right' ? '9.5' : '2'}
                    y=${edge === 'bottom' ? '9' : '3'}
                />
                <rect
                    fill="currentColor"
                    fill-opacity="0.4"
                    height="4"
                    visibility=${panel === 'auto' ? 'visible' : 'hidden'}
                    width="7.5"
                    x=${side === 'right' ? '2' : '6.5'}
                    y="9"
                />
                <rect
                    height="10.5"
                    rx="1.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    width="12.5"
                    x="1.75"
                    y="2.75"
                />
            </svg>
        `;
    },
    { name: 'DockIcon' }
);

// A box with an arrow leaving its corner, or entering it to dock again.
export const PlacementIcon = component<{ direction: 'in' | 'out' }>(
    (html, { direction }) => html`
        <svg
            aria-hidden="true"
            class="hud-icon"
            fill="none"
            viewBox="0 0 16 16"
        >
            <path
                d="M7 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V9"
                stroke="currentColor"
                stroke-width="1.5"
            />
            <path
                d=${direction === 'out' ? 'M8 8l6-6M10 2h4v4' : 'M14 2L8 8M8 4v4h4'}
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
            />
        </svg>
    `,
    { name: 'PlacementIcon' }
);

/** The loom mark; its circles match `LOGO_CIRCLES` (`logo.ts`). */
export const LoomLogo = component(
    (html) => html`
        <svg aria-hidden="true" class="hud-logo" viewBox="0 0 114.92 114.92">
            <circle cx="57.46" cy="57.46" r="57.46" fill="#363230" />
            <circle cx="57.46" cy="57.46" r="44.5" fill="#F05A28" />
            <circle cx="47.6" cy="67.33" r="41.5" fill="#363230" />
            <circle cx="47.6" cy="67.33" r="30.5" fill="#FF0095" />
            <circle cx="40.6" cy="74.33" r="27.5" fill="#363230" />
            <circle cx="39.5" cy="75.5" r="18.5" fill="#C653C4" />
            <circle cx="35.5" cy="79.5" r="14.5" fill="#363230" />
        </svg>
    `,
    { name: 'LoomLogo' }
);
