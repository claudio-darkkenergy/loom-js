import { component } from '@loomjs/core';

import { ContentfulAsset } from '@app/types/contentful';

interface BodyTopProps {
    icons: ContentfulAsset[];
}

export const BodyTop = component<BodyTopProps>(
    (html) => html`<script defer="defer" src="/assets/js/rollbar.js"></script>`
);
