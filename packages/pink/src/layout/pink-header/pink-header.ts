import { SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import { Header } from '@loom-js/components';

export const PinkHeader: SimpleComponent = ({ className, ...props }) =>
    Header({ ...props, className: classNames(className, 'grid-header') });
