import type { PinkDynamicProps } from '../../types';
import type { SimpleComponent } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkCodePanelProps = PinkDynamicProps & {
    codePanelContent?: string;
    codePanelTextColor?: string;
};

/**
 * Code panels are used to create a focused view of a block of code, for example to display logs.
 */
export const PinkCodePanel: SimpleComponent<PinkCodePanelProps> = ({
    className,
    codePanelContent,
    codePanelTextColor,
    is = Div,
    style,
    ...props
}) =>
    is({
        ...props,
        className: classNames(className, 'code-panel'),
        style: [
            style,
            {
                '--p-code-panel-content': codePanelContent,
                '--p-code-panel-text-color': codePanelTextColor
            }
        ]
    });
