import { el, simple } from '@loom-js/core';
import classNames from 'classnames';

import {
    type WithIconProps,
    withIcon,
    type WithTooltipProps,
    withTooltip
} from '../../modifiers';

export interface PinkTooltipProps extends WithTooltipProps, WithIconProps {
    isTag?: boolean;
}

// Pure delegation over the props transformers — the root `<button>` comes
// from `el()`; the transformers stay props-in/props-out.
export const PinkTooltip = simple<PinkTooltipProps>(
    ({ attrs, className, isTag, ...props }) =>
        el('button')(
            withIcon(
                withTooltip({
                    ...props,
                    attrs: { ...attrs, type: 'button' },
                    className: classNames(className, {
                        tag: isTag
                    })
                })
            )
        )
);
