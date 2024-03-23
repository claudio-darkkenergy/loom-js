import { SimpleComponent } from '@loom-js/core';
import { Header } from '@loom-js/tags';
import classNames from 'classnames';

export const PinkHeader: SimpleComponent = ({ className, ...props }) =>
    Header({ ...props, className: classNames(className, 'grid-header') });
