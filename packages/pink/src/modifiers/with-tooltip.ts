import { TemplateTagValue, type ComponentProps } from '@loom-js/core';
import { Span } from '@loom-js/tags';
import classNames from 'classnames';

export interface WithTooltipProps {
    isBottom?: boolean;
    isCenter?: boolean;
    isEnd?: boolean;
    popupClassName?: string;
    popupMessage?: TemplateTagValue;
}

export const withTooltip = ({
    children,
    className,
    isBottom,
    isCenter,
    isEnd,
    popupClassName = '',
    popupMessage,
    ...props
}: ComponentProps<WithTooltipProps>) => {
    const childrenWithTooltip = [].concat(
        children as any,
        Span({
            attrs: {
                role: 'tooltip'
            },
            children: popupMessage,
            className: classNames(
                popupClassName,
                {
                    'is-bottom': isBottom,
                    'is-center': isCenter,
                    'is-end': isEnd
                },
                'tooltip-popup'
            )
        }) as any
    );

    return {
        ...props,
        children: popupMessage ? childrenWithTooltip : children,
        className: classNames(className, 'tooltip')
    };
};
