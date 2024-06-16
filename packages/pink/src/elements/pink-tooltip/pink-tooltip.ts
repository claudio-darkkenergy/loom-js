import {
    type WithIconProps,
    withIcon,
    type WithTooltipProps,
    withTooltip
} from '../../modifiers';
import type { SimpleComponent } from '@loom-js/core';
import { Button } from '@loom-js/tags';
import classNames from 'classnames';

export interface PinkTooltipProps extends WithTooltipProps, WithIconProps {
    isTag?: boolean;
}

export const PinkTooltip: SimpleComponent<PinkTooltipProps> = ({
    className,
    isTag,
    ...props
}) =>
    Button(
        withIcon(
            withTooltip({
                ...props,
                className: classNames(className, {
                    tag: isTag
                })
            })
        )
    );
