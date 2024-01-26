import { component } from '@loom-js/core';

import { ContentfulAsset } from '@app/types/contentful';

interface BodyTopProps {
    icons: ContentfulAsset[];
}

export const BodyTop = component<BodyTopProps>(
    (html) => html`<script defer="defer" src="/assets/js/rollbar.js"></script>`
);
