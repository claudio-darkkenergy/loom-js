import type { PinkDynamicProps } from '../../types';
import { PinkCodePanelContent } from './pink-code-panel-content';
import { PinkCodePanelHeader } from './pink-code-panel-header';
import type { ComponentOptionalProps } from '@loom-js/core';
import { Span } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkCodePanelProps = PinkDynamicProps & {
    codePanelContent?: string;
    codePanelTextColor?: string;
};

/**
 * Code panels are used to create a focused view of a block of code, for example to display logs.
 */
export const PinkCodePanel = ({
    className,
    codePanelContent,
    codePanelTextColor,
    is = Span,
    style,
    ...props
}: ComponentOptionalProps & PinkCodePanelProps) =>
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

PinkCodePanel.Header = PinkCodePanelHeader;
PinkCodePanel.Content = PinkCodePanelContent;
