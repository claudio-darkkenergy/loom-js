import { el, type SimpleComponent } from '@loom-js/core';

import { PinkTag, type PinkTagProps } from '../pink-tag';

export type PinkInteractiveTagProps = PinkTagProps & {
    disabled?: boolean;
    // When set, the root element is an `<a>` (target defaults to `_self`);
    // without it, the root is a `<button>` (type defaults to `button`).
    // `attrs` entries override the root defaults.
    href?: string;
};

export const PinkInteractiveTag: SimpleComponent<PinkInteractiveTagProps> = ({
    attrs,
    disabled,
    href,
    ...props
}) =>
    PinkTag.Tag({
        ...props,
        attrs: {
            ...(href === undefined
                ? { type: 'button' }
                : { href, target: '_self' }),
            ...attrs,
            ...(disabled === undefined ? {} : { disabled })
        },
        is: href === undefined ? el('button') : el('a')
    });
