import { component } from '@loom-js/core';

import type { HudState } from '../state';
import { Header } from './header';
import { ActivitiesPane, InspectorPane, TreePane } from './panes';

const ComponentsTab = component<{ state: HudState }>(
    (html, { state }) => html`
        <div class="hud-split">
            ${TreePane({ state })} ${InspectorPane({ state })}
        </div>
    `,
    { name: 'ComponentsTab' }
);

export const Hud = component<{ state: HudState }>(
    (html, { state }) => html`
        <div class="hud">
            ${Header({ state })}
            <main class="hud-main">
                ${state.tab.effect(({ value }) =>
                    value === 'components'
                        ? ComponentsTab({ state })
                        : ActivitiesPane({ state })
                )}
            </main>
        </div>
    `,
    { name: 'Hud' }
);
