import { type AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '../../../helpers';

export const Nav = component((html, { attrs, children, on, ...navProps }) => {
    const attrsOverrides = mergeAllowedAttrs(
        attrs,
        navProps as unknown as AttrsTemplateTagValue
    );

    return html`
        <nav $attrs=${attrsOverrides} $on=${on}>${children}</nav>
    `;
});
