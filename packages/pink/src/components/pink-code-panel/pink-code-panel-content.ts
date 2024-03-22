import { component, ComponentOptionalProps } from '@loom-js/core';
import classNames from 'classnames';

import { Code } from '@loom-js/components';

export interface PinkCodePanelContentProps extends ComponentOptionalProps {
    children: string;
}

const CodeLine = component(
    (html, { children }) => html`
        <div class="u-contents">
            <div class="grid-code-line-number"></div>
            <pre>${children}</pre>
        </div>
    `
);

export const PinkCodePanelContent = ({
    children,
    className,
    ...props
}: PinkCodePanelContentProps) =>
    Code({
        ...props,
        children: children
            ?.split('\n')
            .map((codeLineText) => CodeLine({ children: codeLineText })),
        className: classNames(className, 'code-panel-content grid-code')
    });
