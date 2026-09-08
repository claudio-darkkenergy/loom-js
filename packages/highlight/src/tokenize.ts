import type { Token, TokenStream } from 'prismjs';

import type { PrismInstance } from './prism';

// The canonical token vocabulary UI libraries theme against. Tokenizer types
// map onto these; the tokenizer itself stays an implementation detail.
export type CodeTokenKind =
    | 'attr-name'
    | 'attr-value'
    | 'class-name'
    | 'comment'
    | 'constant'
    | 'function'
    | 'keyword'
    | 'number'
    | 'operator'
    | 'plain'
    | 'property'
    | 'punctuation'
    | 'regex'
    | 'string'
    | 'tag'
    | 'variable';

export interface CodeToken {
    kind: CodeTokenKind;
    text: string;
}

// Short forms content authors write → registered grammar names.
const LANGUAGE_ALIASES: Record<string, string> = {
    bash: 'bash',
    html: 'markup',
    javascript: 'javascript',
    js: 'javascript',
    markup: 'markup',
    sh: 'bash',
    shell: 'bash',
    svg: 'markup',
    ts: 'typescript',
    typescript: 'typescript',
    xml: 'markup'
};

// Prism token types → kinds. Anything unlisted renders `plain`.
const KIND_BY_PRISM_TYPE: Record<string, CodeTokenKind> = {
    'attr-equals': 'punctuation',
    'attr-name': 'attr-name',
    'attr-value': 'attr-value',
    arrow: 'operator',
    assign: 'operator',
    boolean: 'constant',
    builtin: 'function',
    cdata: 'comment',
    char: 'string',
    'class-name': 'class-name',
    comment: 'comment',
    constant: 'constant',
    doctype: 'comment',
    entity: 'constant',
    function: 'function',
    'function-variable': 'function',
    'interpolation-punctuation': 'punctuation',
    keyword: 'keyword',
    null: 'constant',
    number: 'number',
    operator: 'operator',
    parameter: 'variable',
    prolog: 'comment',
    property: 'property',
    'property-access': 'property',
    punctuation: 'punctuation',
    regex: 'regex',
    shebang: 'comment',
    string: 'string',
    'string-property': 'property',
    tag: 'tag',
    'template-punctuation': 'string',
    'template-string': 'string',
    variable: 'variable'
};

export const resolveLanguage = (language: string | undefined) =>
    language === undefined ? undefined : LANGUAGE_ALIASES[language.trim()];

const isToken = (node: string | Token): node is Token =>
    typeof node !== 'string';

// Walks Prism's nested token tree to a flat leaf sequence. A leaf takes the
// innermost mapped type; a leaf whose own type is unmapped inherits its
// nearest mapped ancestor (e.g. a template literal's plain text segments).
const flattenTokens = (
    stream: TokenStream,
    inherited: CodeTokenKind,
    into: CodeToken[]
): CodeToken[] => {
    const nodes = Array.isArray(stream) ? stream : [stream];

    for (const node of nodes) {
        if (!isToken(node)) {
            into.push({ kind: inherited, text: node });
            continue;
        }

        const kind = KIND_BY_PRISM_TYPE[node.type] ?? inherited;

        if (typeof node.content === 'string') {
            into.push({ kind, text: node.content });
        } else {
            flattenTokens(node.content, kind, into);
        }
    }

    return into;
};

// Merges adjacent same-kind leaves so the DOM carries one element per run.
const mergeRuns = (tokens: CodeToken[]) =>
    tokens.reduce<CodeToken[]>((merged, token) => {
        const last = merged[merged.length - 1];

        if (last && last.kind === token.kind) {
            last.text += token.text;
        } else {
            merged.push({ ...token });
        }

        return merged;
    }, []);

// HTML comments inside template literals: Prism's JS/TS grammars type the
// whole template body as one string token, which would paint `<!-- … -->`
// like markup. Re-kind those runs as comments so annotations read as
// annotations. (A quoted string containing a literal `<!--` re-kinds too —
// acceptable for a highlighter.)
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

const rekindHtmlComments = (tokens: CodeToken[]): CodeToken[] =>
    tokens.flatMap((token) => {
        if (token.kind !== 'string' || !token.text.includes('<!--')) {
            return [token];
        }

        const pieces: CodeToken[] = [];
        let cursor = 0;

        for (const match of token.text.matchAll(HTML_COMMENT)) {
            if (match.index > cursor) {
                pieces.push({
                    kind: 'string',
                    text: token.text.slice(cursor, match.index)
                });
            }

            pieces.push({ kind: 'comment', text: match[0] });
            cursor = match.index + match[0].length;
        }

        if (cursor < token.text.length) {
            pieces.push({ kind: 'string', text: token.text.slice(cursor) });
        }

        return pieces;
    });

/**
 * Pure text → tokens against a loaded Prism instance. Unknown languages come
 * back as one `plain` token so callers need no branch; the tokenizer runs
 * synchronously with no DOM.
 */
export const tokenizeCode = (
    prism: PrismInstance,
    text: string,
    language: string | undefined
): CodeToken[] => {
    const grammarName = resolveLanguage(language);
    const grammar = grammarName && prism.languages[grammarName];

    if (!grammar) {
        return [{ kind: 'plain', text }];
    }

    return mergeRuns(
        rekindHtmlComments(
            flattenTokens(prism.tokenize(text, grammar), 'plain', [])
        )
    );
};
