import { ComponentOptionalProps, SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import { Div, Span } from '@app/components/simple';

import { PinkDynamicProps } from '../../types';

interface TagProps extends PinkDynamicProps {
    isDanger?: boolean;
    // The classname for the icon - renders only when provided.
    icon?: string;
    isEyebrowHeading?: boolean;
    isInfo?: boolean;
    isSuccess?: boolean;
    isWarning?: boolean;
}

const Tag: SimpleComponent<TagProps> = ({
    children,
    className,
    icon,
    is = Div,
    isDanger,
    isEyebrowHeading,
    isInfo,
    isSuccess,
    isWarning,
    ...props
}) =>
    is({
        ...props,
        children: icon
            ? [
                  Span({
                      attrs: {
                          'aria-hidden': true
                      },
                      className: icon
                  }),
                  children
              ]
            : children,
        className: classNames(className, 'tag', {
            'eyebrow-heading': isEyebrowHeading,
            'is-danger': isDanger,
            'is-info': isInfo,
            'is-success': isSuccess,
            'is-warning': isWarning
        })
    });

export type PinkTagProps = ComponentOptionalProps & Omit<TagProps, 'is'>;

/**
 * Tags help organize and differentiate between different categories of content. In the Appwrite console, tags may be interactive or static.
 */
export const PinkTag = (props: PinkTagProps) => Tag(props);

PinkTag.Tag = Tag;
