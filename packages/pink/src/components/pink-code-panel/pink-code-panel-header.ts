import { SimpleComponent } from '@loom-js/core';
import { Header } from '@loom-js/tags';
import classNames from 'classnames';

export const PinkCodePanelHeader: SimpleComponent = ({ className, ...props }) =>
    Header({
        ...props,
        className: classNames(className, 'code-panel-header')
    });
