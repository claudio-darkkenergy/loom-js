import type { PinkDynamicProps } from '../../types';
import { simple } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkCardProps = PinkDynamicProps & {
    isBorderDashed?: boolean;
    isAllowFocus?: boolean;
};

export const PinkCard = simple<PinkCardProps>(function pinkCard({
    is = Div,
    className,
    isAllowFocus,
    isBorderDashed,
    ...props
}) {
    return is({
        ...props,
        className: classNames(className, 'card', {
            'is-border-dashed': isBorderDashed,
            'is-allow-focus': isAllowFocus
        })
    });
});
