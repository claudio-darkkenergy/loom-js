import {
    component,
    type ComponentInputProps,
    type lazyImport
} from '@loom-js/core';
import classNames from 'classnames';

import {
    type CodeToken,
    splitTokenLines,
    type Tokenize
} from './lib/token-lines';

export type { CodeToken, Tokenize } from './lib/token-lines';

// A tokenizer as a lazy-import activity (`@loom-js/highlight`'s
// `codeTokenizer()` is one): `undefined` until loaded, then `Tokenize`.
export type TokenizeActivity = ReturnType<typeof lazyImport<Tokenize>>;

export type CodeLineProps = {
    tokens?: CodeToken[];
    useLineNumber?: boolean;
};

// Splitting the raw source into lines is a parsing concern of its own
// (SOLID audit SRP entry) — kept out of the render path.
const splitCodeLines = (source: string): string[] | undefined =>
    source?.split('\n');

// One themed run of a line. `plain` runs render as bare text so an
// un-highlighted stretch adds no element.
const CodeTokenSpan = component<ComponentInputProps<{ kind: string }>>(
    (html, { children, kind }) => html`
        <span class=${`code-token is-${kind}`}>${children}</span>
    `
);

const renderTokens = (tokens: CodeToken[]) =>
    tokens.map(({ kind, text }) =>
        kind === 'plain' ? text : CodeTokenSpan({ children: text, kind })
    );

const CodeLine = component<CodeLineProps>(
    (html, { children, tokens, useLineNumber = false }) => {
        // Maintain an empty line when receiving `''` (or no tokens).
        const text = tokens?.length ? renderTokens(tokens) : children || ' ';

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
    // The language handed to `tokenize`. Without both `language` and
    // `tokenize`, lines render as plain text, exactly as without highlighting.
    language?: string;
    // The tokenizer, inverted in from the app layer so pink carries no
    // highlighting dependency — see `@loom-js/highlight`.
    tokenize?: TokenizeActivity;
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
            language,
            on,
            onClick,
            style,
            tokenize,
            useLineNumbers = true
        }
    ) => {
        const codeLines = splitCodeLines(children);
        const renderLines = (tokenLines?: CodeToken[][]) =>
            codeLines?.map((codeLineText, lineIndex) =>
                CodeLine({
                    children: codeLineText,
                    tokens: tokenLines?.[lineIndex],
                    useLineNumber: useLineNumbers
                })
            );

        return html`
            <code
                $attrs=${attrs}
                $click=${onClick}
                $on=${on}
                class=${classNames(className, 'code-panel-content grid-code')}
                id=${id}
                style=${style}
            >
                ${
                    language && tokenize
                        ? // Lines render plain until the tokenizer lands, then
                          // re-render tokenized — the whole source is tokenized
                          // first so multi-line tokens keep their kind per row.
                          tokenize.effect(({ value: tokenizeSource }) =>
                              renderLines(
                                  tokenizeSource &&
                                      splitTokenLines(
                                          tokenizeSource(children, language)
                                      )
                              )
                          )
                        : renderLines()
                }
            </code>
        `;
    }
);
