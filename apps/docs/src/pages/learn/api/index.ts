import { component } from '@loom-js/core';

import { App } from '@app/bootstrap';

const API = component((html) => {
    return html`<>
        Hello API!
    </>`;
});

App(API);
