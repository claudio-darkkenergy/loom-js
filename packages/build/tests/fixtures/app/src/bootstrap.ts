import {
    APP_ROOT_ID,
    STATE_SCRIPT_ID,
    hydrate,
    primeResources,
    type SerializedStateEnvelope
} from '@loom-js/core';

import { App } from './app';

declare const __DEV__: boolean;
declare const __FIXTURE_NAME__: string;

const payload = document.getElementById(STATE_SCRIPT_ID)?.textContent?.trim();

payload && primeResources(JSON.parse(payload) as SerializedStateEnvelope);
console.info(__FIXTURE_NAME__, __DEV__);
hydrate({
    app: App(),
    root: document.getElementById(APP_ROOT_ID) ?? undefined
});
