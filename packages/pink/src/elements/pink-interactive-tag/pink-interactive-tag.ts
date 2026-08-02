import type { SimpleComponent } from '@loom-js/core';
import { Button, Link } from '@loom-js/tags';

import { PinkTag, type PinkTagProps } from '../pink-tag';

export type PinkInteractiveTagProps = PinkTagProps & {
    href?: string;
};

export const PinkInteractiveTag: SimpleComponent<PinkInteractiveTagProps> = ({
    href,
    ...props
}) =>
    PinkTag.Tag({
        ...props,
        href,
        is: href === undefined ? Button : Link
    });
