import { Breadcrumbs } from '@/app/components/content/breadcrumbs';
import { routeEffect, type SimpleComponent } from '@loom-js/core';
import { PinkContainer, PinkContainerProps } from '@loom-js/pink';
import classNames from 'classnames';

export type DocContainerProps = PinkContainerProps;

export const DocContainer: SimpleComponent<DocContainerProps> = ({
    children,
    className,
    ...props
}) =>
    PinkContainer({
        ...props,
        className: classNames('u-overflow-hidden', className),
        children: [
            routeEffect(({ value: { pathname = '' } }) =>
                Breadcrumbs({ pathname })
            ),
            children
        ]
    });
