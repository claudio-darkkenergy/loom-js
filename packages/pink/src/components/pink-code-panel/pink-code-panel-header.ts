import { SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import { Header } from '@loom-js/components';

export const PinkCodePanelHeader: SimpleComponent = ({ className, ...props }) =>
    Header({
        ...props,
        className: classNames(className, 'code-panel-header')
    });
