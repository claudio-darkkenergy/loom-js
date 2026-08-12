import type { ComponentInputProps, SimpleComponent } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

import { withIcon } from '../../modifiers/with-icon';
import type { PinkDynamicProps } from '../../types';

type Enumerate<
    N extends number,
    Acc extends number[] = []
> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>;

type NumberRange<F extends number, T extends number> =
    Exclude<Enumerate<T>, Enumerate<F>> | T;

type TagProps = PinkDynamicProps & {
    // Appends the icon when provided vs. prepend placement.
    appendIcon?: boolean;
    // Forwarded to the root by interactive tags (`PinkInteractiveTag`).
    href?: string;
    isDanger?: boolean;
    // The classname for the icon - renders only when provided.
    icon?: string;
    isEyebrowHeading?: boolean | NumberRange<1, 3>;
    isInfo?: boolean;
    isSelected?: boolean;
    isSuccess?: boolean;
    isWarning?: boolean;
};

const Tag: SimpleComponent<TagProps> = ({
    className,
    is = Div,
    isDanger,
    isEyebrowHeading,
    isInfo,
    isSelected,
    isSuccess,
    isWarning,
    ...props
}) => {
    const eyebrowHeadingClassName = `eyebrow-heading${isEyebrowHeading ? `-${Number(isEyebrowHeading)}` : ''}`;

    return is(
        withIcon({
            ...props,
            className: classNames(className, 'tag', {
                [eyebrowHeadingClassName]: Boolean(isEyebrowHeading),
                'is-danger': isDanger,
                'is-info': isInfo,
                'is-selected': isSelected,
                'is-success': isSuccess,
                'is-warning': isWarning
            })
        })
    );
};

export type PinkTagProps = Omit<TagProps, 'is'>;

/**
 * Tags help organize and differentiate between different categories of content. In the Appwrite console, tags may be interactive or static.
 */
export const PinkTag = (props: ComponentInputProps<PinkTagProps>) => Tag(props);

PinkTag.Tag = Tag;
