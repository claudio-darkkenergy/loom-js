import { component, ComponentOptionalProps } from '@loom-js/core';
import { Code, Span } from '@loom-js/tags';
import classNames from 'classnames';

export type CodeLineProps = {
    useLineNumber?: boolean;
};

const CodeLine = component<CodeLineProps>(
    (html, { children, useLineNumber = false }) => {
        // Maintain an empty line when receiving `''`.
        const text = children || ' ';

        return html`
            <span class="u-contents">
                ${Span({
                    attrs: { 'aria-hidden': !useLineNumber },
                    className: classNames({
                        'grid-code-line-number': useLineNumber
                    })
                })}
                <pre>${text}</pre>
            </span>
        `;
    }
);

export interface PinkCodePanelContentProps extends ComponentOptionalProps {
    children: string;
    useLineNumbers?: boolean;
}

export const PinkCodePanelContent = ({
    children,
    className,
    useLineNumbers = true,
    ...props
}: PinkCodePanelContentProps) =>
    Code({
        ...props,
        children: children?.split('\n').map((codeLineText) =>
            CodeLine({
                children: codeLineText,
                useLineNumber: useLineNumbers
            })
        ),
        className: classNames(className, 'code-panel-content grid-code')
    });
