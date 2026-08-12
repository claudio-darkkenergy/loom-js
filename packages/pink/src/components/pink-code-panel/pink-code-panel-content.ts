import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

export type CodeLineProps = {
    useLineNumber?: boolean;
};

// Splitting the raw source into lines is a parsing concern of its own
// (SOLID audit SRP entry) — kept out of the render path.
const splitCodeLines = (source: string): string[] | undefined =>
    source?.split('\n');

const CodeLine = component<CodeLineProps>(
    (html, { children, useLineNumber = false }) => {
        // Maintain an empty line when receiving `''`.
        const text = children || ' ';

        return html`
            <span class="u-contents">
                <span
                    $attrs=${{ 'aria-hidden': !useLineNumber }}
                    class=${useLineNumber ? 'grid-code-line-number' : undefined}
                ></span>
                <pre>${text}</pre>
            </span>
        `;
    }
);

export type PinkCodePanelContentProps = ComponentInputProps<{
    children: string;
    useLineNumbers?: boolean;
}>;

export const PinkCodePanelContent = component<PinkCodePanelContentProps>(
    (
        html,
        {
            attrs,
            children,
            className,
            id,
            on,
            onClick,
            style,
            useLineNumbers = true
        }
    ) => html`
        <code
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'code-panel-content grid-code')}
            id=${id}
            style=${style}
        >
            ${splitCodeLines(children)?.map((codeLineText) =>
                CodeLine({
                    children: codeLineText,
                    useLineNumber: useLineNumbers
                })
            )}
        </code>
    `
);
