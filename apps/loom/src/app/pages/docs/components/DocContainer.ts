import { Breadcrumbs } from '@/app/components/content/breadcrumbs';
import { routeEffect, type SimpleComponent } from '@loom-js/core';
import { PinkContainer, PinkContainerProps } from '@loom-js/pink';

export type DocContainerProps = PinkContainerProps;

export const DocContainer: SimpleComponent<DocContainerProps> = ({
    children,
    ...props
}) =>
    PinkContainer({
        ...props,
        children: [
            routeEffect(({ value: { pathname = '' } }) =>
                Breadcrumbs({ pathname })
            ),
            children
        ]
    });
