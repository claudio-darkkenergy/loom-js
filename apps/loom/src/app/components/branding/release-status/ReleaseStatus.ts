import { component } from '@loom-js/core';
import { PinkTag } from '@loom-js/pink';

const CORE_NPM_URL = 'https://www.npmjs.com/package/@loom-js/core';

/**
 * The framework's release status beside the brand logo: a "Beta" badge and
 * the `@loom-js/core` version the site was built against.
 */
export const ReleaseStatus = component(
    (html) => html`
        <div class="u-cross-center u-flex u-gap-8">
            <${PinkTag} isEyebrowHeading>Beta</>
            <a
                class="body-text-2 u-color-text-gray"
                href=${CORE_NPM_URL}
                rel="noopener"
                target="_blank"
                >v${__CORE_VERSION__}</a
            >
        </div>
    `
);
