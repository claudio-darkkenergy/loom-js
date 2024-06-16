import { withIcon } from '../../modifiers/with-icon';
import { PinkDynamicProps } from '../../types';
import { ComponentOptionalProps, SimpleComponent } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

type Enumerate<
    N extends number,
    Acc extends number[] = []
> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>;
type NumberRange<F extends number, T extends number> =
    | Exclude<Enumerate<T>, Enumerate<F>>
    | T;

interface TagProps extends PinkDynamicProps {
    // Appends the icon when provided vs. prepend placement.
    appendIcon?: boolean;
    isDanger?: boolean;
    // The classname for the icon - renders only when provided.
    icon?: string;
    isEyebrowHeading?: boolean | NumberRange<1, 3>;
    isInfo?: boolean;
    isSelected?: boolean;
    isSuccess?: boolean;
    isWarning?: boolean;
}

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

export type PinkTagProps = ComponentOptionalProps & Omit<TagProps, 'is'>;

/**
 * Tags help organize and differentiate between different categories of content. In the Appwrite console, tags may be interactive or static.
 */
export const PinkTag = (props: PinkTagProps) => Tag(props);

PinkTag.Tag = Tag;
