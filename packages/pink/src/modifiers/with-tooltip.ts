import { TemplateTagValue, type ComponentInputProps } from '@loom-js/core';

import { PinkTooltipPopup } from '../elements/pink-tooltip/pink-tooltip-popup';
import { cn } from '../utils/cn';

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
        PinkTooltipPopup({
            children: popupMessage,
            className: popupClassName,
            isBottom,
            isCenter,
            isEnd
        }) as any
    );

    return {
        ...props,
        children: popupMessage ? childrenWithTooltip : children,
        className: cn(className, 'tooltip')
    };
};
