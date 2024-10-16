import type { PinkDynamicProps } from '../../types';
import { SimpleComponent } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkCardProps = PinkDynamicProps & {
    isBorderDashed?: boolean;
    isAllowFocus?: boolean;
};

export const PinkCard: SimpleComponent<PinkCardProps> = ({
    is = Div,
    className,
    isAllowFocus,
    isBorderDashed,
    ...props
}) =>
    is({
        ...props,
        className: classNames(className, 'card', {
            'is-border-dashed': isBorderDashed,
            'is-allow-focus': isAllowFocus
        })
    });
