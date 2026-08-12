import { el, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

import type { PinkDynamicProps } from '../../types';
import { PinkCodePanelContent } from './pink-code-panel-content';
import { PinkCodePanelHeader } from './pink-code-panel-header';

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
    is = el('span'),
    style,
    ...props
}: ComponentInputProps<PinkCodePanelProps>) =>
    is({
        ...props,
        className: classNames(className, 'code-panel'),
        // Omitted entirely when empty — a style value that resolves to
        // nothing must not reach the root's style binding.
        style:
            codePanelContent === undefined && codePanelTextColor === undefined
                ? style
                : [
                      style,
                      {
                          '--p-code-panel-content': codePanelContent,
                          '--p-code-panel-text-color': codePanelTextColor
                      }
                  ]
    });

PinkCodePanel.Header = PinkCodePanelHeader;
PinkCodePanel.Content = PinkCodePanelContent;
