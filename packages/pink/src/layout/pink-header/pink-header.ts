import { SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import { Header } from '@app/components/simple';

export const PinkHeader: SimpleComponent = ({ className, ...props }) =>
    Header({ ...props, className: classNames(className, 'grid-header') });
