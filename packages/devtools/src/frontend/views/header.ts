import { type ContextFunction, component } from '@loom-js/core';

import type { DockPosition, DockState } from '../../protocol/types';
import { derive } from '../derive';
import type { HudState, Tab, Toggles } from '../state';
import { Chevron, type ChevronDirection } from './chevron';
import {
    DockIcon,
    FlashIcon,
    LoomLogo,
    PerfIcon,
    PickIcon,
    PlacementIcon
} from './icons';

interface ToggleButtonProps {
    // Shown in place of the label, which then names the button.
    icon?: ContextFunction;
    label: string;
    isOn: boolean;
    name: keyof Toggles;
    state: HudState;
    title: string;
}

const ToggleButton = component<ToggleButtonProps>(
    (html, { icon, isOn, label, name, state, title }) => html`
        <button
            aria-label=${icon ? label : undefined}
            aria-pressed=${isOn ? 'true' : 'false'}
            class=${`hud-button ${icon ? 'icon-button' : ''} ${isOn ? 'is-on' : ''}`}
            $click=${() => state.actions.setToggle(name, !isOn)}
            title=${title}
            type="button"
        >
            ${icon ?? label}
        </button>
    `,
    { name: 'ToggleButton' }
);

const TabButton = component<{
    label: string;
    selected: boolean;
    state: HudState;
    tab: Tab;
}>(
    (html, { label, selected, state, tab }) => html`
        <button
            aria-selected=${selected ? 'true' : 'false'}
            class=${`hud-tab ${selected ? 'is-selected' : ''}`}
            $click=${() => state.actions.setTab(tab)}
            role="tab"
            type="button"
        >
            ${label}
        </button>
    `,
    { name: 'TabButton' }
);

const STATUS_TEXT = {
    connected: 'connected',
    connecting: 'waiting for the page…',
    refused: 'version conflict'
};

export const Header = component<{ state: HudState }>(
    (html, { own, state }) => {
        const view = own(() =>
            derive(
                [
                    state.connection,
                    state.dock,
                    state.tab,
                    state.toggles,
                    state.notice
                ],
                (connection, dock, tab, toggles, notice) => ({
                    collapsed: !!dock?.collapsed,
                    connection,
                    dock,
                    notice,
                    tab,
                    toggles
                })
            )
        );

        return html`
            <header
                class=${view.bind(({ collapsed }) => `hud-header ${collapsed ? 'is-collapsed' : ''}`)}
            >
                ${view.effect(
                    ({ value: { connection, dock, notice, tab, toggles } }) =>
                        dock?.collapsed && dock.edge === 'side'
                            ? CollapsedStrip({ dock, state })
                            : [
                                  HeaderBar({
                                      connection,
                                      dock,
                                      state,
                                      tab,
                                      toggles
                                  }),
                                  // A page can't open the Performance panel, so
                                  // say where the entries go.
                                  toggles.perf && !dock?.collapsed
                                      ? Hint({
                                            key: 'perf-hint',
                                            text: PERF_HINT
                                        })
                                      : '',
                                  notice
                                      ? Notice({ key: 'notice', text: notice })
                                      : ''
                              ]
                )}
            </header>
        `;
    },
    { name: 'Header' }
);

interface HeaderBarProps {
    connection: ReturnType<HudState['connection']['value']>;
    dock: DockState | undefined;
    state: HudState;
    tab: Tab;
    toggles: Toggles;
}

const HeaderBar = component<HeaderBarProps>(
    (html, { connection, dock, state, tab, toggles }) => html`
        <div class="hud-bar">
            <span class="hud-brand">${LoomLogo()} loom</span>
            <span
                class=${`hud-status is-${connection.status}`}
                title=${connection.message ?? STATUS_TEXT[connection.status]}
            >
                ${STATUS_TEXT[connection.status]}
            </span>
            <nav class="hud-tabs" role="tablist">
                ${TabButton({ label: 'Components', selected: tab === 'components', state, tab: 'components' })}
                ${TabButton({ label: 'Activities', selected: tab === 'activities', state, tab: 'activities' })}
            </nav>
            <span class="hud-spacer"></span>
            ${ToggleButton({ icon: PickIcon(), label: 'Pick', name: 'picking', isOn: toggles.picking, state, title: 'Pick a component in the page' })}
            ${ToggleButton({ icon: FlashIcon(), label: 'Flash renders', name: 'flash', isOn: toggles.flash, state, title: 'Outline each component as it renders' })}
            ${ToggleButton({ icon: PerfIcon(), label: 'Perf tracks', name: 'perf', isOn: toggles.perf, state, title: 'Record renders and commits on a loom track in the Performance panel' })}
            ${dock ? PlacementControls({ dock, state }) : ''}
            ${dock ? CollapseButton({ dock, state }) : ''}
            <button
                aria-label="Close devtools"
                class="hud-button"
                $click=${() => state.actions.close()}
                type="button"
            >
                ✕
            </button>
        </div>
    `,
    { name: 'HeaderBar' }
);

// The arrow points the way the dock will go: toward its edge to collapse,
// away from it to expand. A floating window minimizes downward.
const collapseDirection = ({
    collapsed,
    edge,
    side
}: DockState): ChevronDirection => {
    const outward = edge === 'side' ? side : 'down';
    const inward =
        edge === 'bottom' ? 'up' : side === 'right' ? 'left' : 'right';

    return collapsed ? inward : outward;
};

const collapseLabel = ({ collapsed, edge }: DockState) =>
    collapsed
        ? 'Expand devtools'
        : edge === 'float'
          ? 'Minimize devtools'
          : 'Collapse devtools';

const CollapseButton = component<{ dock: DockState; state: HudState }>(
    (html, { dock, state }) => html`
        <button
            aria-label=${collapseLabel(dock)}
            aria-pressed=${dock.collapsed ? 'true' : 'false'}
            class="hud-button icon-button collapse-button"
            $click=${() => state.actions.toggleDock()}
            title=${collapseLabel(dock)}
            type="button"
        >
            ${Chevron({ direction: collapseDirection(dock) })}
        </button>
    `,
    { name: 'CollapseButton' }
);

const POSITIONS: [DockPosition, string][] = [
    ['auto', 'Auto'],
    ['bottom', 'Bottom'],
    ['side', 'Side']
];

const positionTitle = (position: DockPosition, { edge, side }: DockState) =>
    position === 'auto'
        ? `Auto: at the side when the window has room${edge === 'float' ? '' : ` (now ${edge === 'side' ? side : 'bottom'})`}`
        : position === 'side'
          ? `Dock at the side (${side})`
          : 'Dock at the bottom';

// The dock's positions, then floating over the page. Auto docks at the side
// when the window has room; a chosen edge holds.
const PlacementControls = component<{ dock: DockState; state: HudState }>(
    (html, { dock, state }) => html`
        <div aria-label="Dock position" class="hud-segmented" role="group">
            ${POSITIONS.map(([position, label]) =>
                PositionButton({ dock, key: position, label, position, state })
            )}
            ${PlacementButton({ floating: dock.floating, state })}
        </div>
    `,
    { name: 'PlacementControls' }
);

// While floating, no edge is current.
const isDockedAt = (
    { floating, position: current }: DockState,
    position: DockPosition
) => !floating && current === position;

const PositionButton = component<{
    dock: DockState;
    label: string;
    position: DockPosition;
    state: HudState;
}>(
    (html, { dock, label, position, state }) => html`
        <button
            aria-label=${label}
            aria-pressed=${isDockedAt(dock, position) ? 'true' : 'false'}
            class=${`hud-button icon-button ${isDockedAt(dock, position) ? 'is-on' : ''}`}
            $click=${() => state.actions.placeDock(position)}
            title=${positionTitle(position, dock)}
            type="button"
            value=${position}
        >
            ${DockIcon({
                panel: position === 'side' ? dock.side : position,
                side: dock.side
            })}
        </button>
    `,
    { name: 'PositionButton' }
);

// A collapsed side dock: just the way back.
const CollapsedStrip = component<{ dock: DockState; state: HudState }>(
    (html, { dock, state }) => html`
        <div class="hud-strip">
            ${CollapseButton({ dock, state })} ${LoomLogo()}
            <span class="hud-brand hud-strip-brand">loom</span>
        </div>
    `,
    { name: 'CollapsedStrip' }
);

const PlacementButton = component<{ floating: boolean; state: HudState }>(
    (html, { floating, state }) => html`
        <button
            aria-label=${floating ? 'Dock' : 'Pop out'}
            class="hud-button icon-button"
            $click=${() => (floating ? state.actions.dock() : state.actions.float())}
            title=${floating ? 'Dock at the page edge' : 'Pop out into a floating window'}
            type="button"
        >
            ${PlacementIcon({ direction: floating ? 'in' : 'out' })}
        </button>
    `,
    { name: 'PlacementButton' }
);

const PERF_HINT =
    'Recording to the loom track — open DevTools › Performance and press record.';

const Hint = component<{ text: string }>(
    (html, { text }) => html`
        <p class="hud-hint" role="status">${text}</p>
    `,
    { name: 'Hint' }
);

const Notice = component<{ text: string }>(
    (html, { text }) => html`
        <p class="hud-notice" role="status">${text}</p>
    `,
    { name: 'Notice' }
);
