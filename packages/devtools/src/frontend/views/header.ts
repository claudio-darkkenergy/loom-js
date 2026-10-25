import { component } from '@loom-js/core';

import { derive } from '../derive';
import type { HudState, Tab, Toggles } from '../state';

interface ToggleButtonProps {
    label: string;
    isOn: boolean;
    name: keyof Toggles;
    state: HudState;
    title: string;
}

const ToggleButton = component<ToggleButtonProps>(
    (html, { isOn, label, name, state, title }) => html`
        <button
            aria-pressed=${isOn ? 'true' : 'false'}
            class=${`hud-button ${isOn ? 'is-on' : ''}`}
            $click=${() => state.actions.setToggle(name, !isOn)}
            title=${title}
            type="button"
        >
            ${label}
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
                [state.connection, state.tab, state.toggles, state.notice],
                (connection, tab, toggles, notice) => ({
                    connection,
                    notice,
                    tab,
                    toggles
                })
            )
        );

        return html`
            <header class="hud-header">
                ${view.effect(
                    ({ value: { connection, notice, tab, toggles } }) => [
                        HeaderBar({ connection, state, tab, toggles }),
                        notice ? Notice({ key: 'notice', text: notice }) : ''
                    ]
                )}
            </header>
        `;
    },
    { name: 'Header' }
);

interface HeaderBarProps {
    connection: ReturnType<HudState['connection']['value']>;
    state: HudState;
    tab: Tab;
    toggles: Toggles;
}

const HeaderBar = component<HeaderBarProps>(
    (html, { connection, state, tab, toggles }) => html`
        <div class="hud-bar">
            <span class="hud-brand">loom</span>
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
            ${ToggleButton({ label: 'Pick', name: 'picking', isOn: toggles.picking, state, title: 'Pick a component in the page' })}
            ${ToggleButton({ label: 'Flash renders', name: 'flash', isOn: toggles.flash, state, title: 'Outline each component as it renders' })}
            ${ToggleButton({ label: 'Perf tracks', name: 'perf', isOn: toggles.perf, state, title: 'Record renders and commits on a loom track in the Performance panel' })}
            ${PlacementButton({ placement: connection.placement, state })}
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

const PlacementButton = component<{ placement: string; state: HudState }>(
    (html, { placement, state }) => html`
        <button
            class="hud-button"
            $click=${() => (placement === 'popup' ? state.actions.dock() : state.actions.popOut())}
            type="button"
        >
            ${placement === 'popup' ? 'Dock' : 'Pop out'}
        </button>
    `,
    { name: 'PlacementButton' }
);

const Notice = component<{ text: string }>(
    (html, { text }) => html`
        <p class="hud-notice" role="status">${text}</p>
    `,
    { name: 'Notice' }
);
