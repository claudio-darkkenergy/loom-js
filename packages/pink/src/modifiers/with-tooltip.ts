import { el, TemplateTagValue, type ComponentInputProps } from '@loom-js/core';
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
}: ComponentInputProps<WithTooltipProps>) => {
    const childrenWithTooltip = [].concat(
        children as any,
        el('span')({
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
