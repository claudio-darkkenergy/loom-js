import { component } from '@loom-js/core';

import { App } from '@app/bootstrap';

const Examples = component((html) => {
    return html`<>
        Hello Examples!
    </>`;
});

App(Examples);
