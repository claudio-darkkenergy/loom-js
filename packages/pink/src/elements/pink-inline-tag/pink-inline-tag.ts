import { SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import { Span } from '@app/components/simple';

interface PinkInlineTagProps {
    isInfo: boolean;
}

/**
 * An inline tag is used as a number label inside a button. Some possible use cases are indicating the number of columns in a table or the number of related items.
 */
export const PinkInlineTag: SimpleComponent<PinkInlineTagProps> = ({
    className,
    isInfo,
    ...props
}) =>
    Span({
        className: classNames(className, 'inline-tag', { 'is-info': isInfo }),
        ...props
    });
