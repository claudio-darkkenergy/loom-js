import { Component, SimpleComponent } from '@loom-js/core';

import { Button, Link } from '@app/components/simple';

import { PinkTag, PinkTagProps } from '../pink-tag';

export interface PinkInteractiveTagProps extends PinkTagProps {
    href?: string;
}

export const PinkInteractiveTag: SimpleComponent<PinkInteractiveTagProps> = ({
    href,
    ...props
}) =>
    PinkTag.Tag({
        ...props,
        href,
        is: href === undefined ? Button : (Link as Component)
    });
