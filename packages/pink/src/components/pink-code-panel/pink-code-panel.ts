import { SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import type { PinkDynamicProps } from '@pink/types';
import { Div } from '@app/components/simple';

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
