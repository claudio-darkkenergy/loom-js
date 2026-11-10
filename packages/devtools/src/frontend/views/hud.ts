import { component } from '@loom-js/core';

import { derive } from '../derive';
import type { HudState } from '../state';
import { Header } from './header';
import { ActivitiesPane, InspectorPane, TreePane } from './panes';

const ComponentsTab = component<{ state: HudState }>(
    (html, { own, state }) => {
        const layout = own(() =>
            derive(
                [state.narrow, state.dock, state.panel],
                (_narrow, _dock, panel) => ({
                    onePanel: state.isOnePanel(),
                    panel
                })
            )
        );

        // One panel at a time slides between tree and details on a track;
        // both stay mounted, so the tree keeps its scroll position.
        return html`
            <div
                class=${layout.bind(({ onePanel, panel }) => `hud-split ${onePanel ? `is-one-panel shows-${panel}` : ''}`)}
            >
                <div
                    class="hud-panel"
                    inert=${layout.bind(({ onePanel, panel }) => onePanel && panel === 'details')}
                >
                    ${TreePane({ state })}
                </div>
                <div
                    class="hud-panel"
                    inert=${layout.bind(({ onePanel, panel }) => onePanel && panel === 'tree')}
                >
                    ${InspectorPane({ state })}
                </div>
            </div>
        `;
    },
    { name: 'ComponentsTab' }
);

export const Hud = component<{ state: HudState }>(
    (html, { own, state }) => {
        // A collapsed side dock shows only its strip.
        const strip = own(() =>
            derive(
                [state.dock],
                (dock) => !!dock?.collapsed && dock.edge === 'side'
            )
        );

        return html`
            <div
                class=${strip.bind((isStrip) => `hud ${isStrip ? 'is-strip' : ''}`)}
            >
                ${Header({ state })}
                <main class="hud-main">
                    ${state.tab.effect(({ value }) =>
                        value === 'components'
                            ? ComponentsTab({ state })
                            : ActivitiesPane({ state })
                    )}
                </main>
            </div>
        `;
    },
    { name: 'Hud' }
);
