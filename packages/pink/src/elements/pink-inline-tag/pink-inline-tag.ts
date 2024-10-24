import { type SimpleComponent } from '@loom-js/core';
import { Span } from '@loom-js/tags';
import classNames from 'classnames';

export interface PinkInlineTagProps {
    isDisabled?: boolean;
    isInfo?: boolean;
}

/**
 * An inline tag is used as a number label inside a button. Some possible use cases are indicating
 * the number of columns in a table or the number of related items.
 */
export const PinkInlineTag: SimpleComponent<PinkInlineTagProps> = ({
    className,
    isDisabled,
    isInfo,
    ...props
}) =>
    Span({
        className: classNames(className, 'inline-tag', {
            'is-disabled': isDisabled,
            'is-info': isInfo
        }),
        ...props
    });
