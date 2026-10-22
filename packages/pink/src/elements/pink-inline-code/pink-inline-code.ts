import { type ComponentInputProps, el, simple } from '@loom-js/core';

import { cn } from '../../utils/cn';

/**
 * Inline code highlights a short snippet of code within a sentence, such as a
 * command, identifier, or file name.
 *
 * Functional composition over `el('code')` on purpose: pink styles `code` as
 * `white-space: pre-wrap`, so a template's indentation around the children
 * would render — the functional form has no template whitespace at all.
 */
export const PinkInlineCode = simple<ComponentInputProps>(
    ({ className, ...props }) =>
        el('code')({
            ...props,
            className: cn(className, 'inline-code')
        })
);
