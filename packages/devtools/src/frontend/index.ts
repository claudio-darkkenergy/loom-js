// The HUD document's entry: connects to the backend in the page (the parent
// window when docked, the opener when popped out) and renders the HUD.
import { init } from '@loom-js/core';
import '@loom-js/pink/pink.css';

import { createClient } from './client';
import { createHudState } from './state';
import './styles.css';
import { Hud } from './views/hud';

const peer = window.parent !== window ? window.parent : window.opener;

if (peer) {
    const client = createClient(window, peer);
    const state = createHudState(client);

    init({
        app: Hud({ state }),
        root: document.getElementById('loom-devtools-hud')
    });
    client.connect();
}
