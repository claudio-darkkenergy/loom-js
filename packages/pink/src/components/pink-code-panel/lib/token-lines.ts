// The token contract a code panel renders. Structural on purpose: a
// highlighter (e.g. `@loom-js/highlight`) produces `{ kind, text }` runs and
// pink themes the kinds it knows (`code-tokens.css`); pink takes no
// dependency on any tokenizer.
export interface CodeToken {
    kind: string;
    text: string;
}

export type Tokenize = (text: string, language: string) => CodeToken[];

/**
 * Slices a flat token stream at newlines so each line owns its tokens — a
 * multi-line token (block comment, template literal) contributes a same-kind
 * piece to every line it spans. Mirrors `splitCodeLines` for plain text.
 */
export const splitTokenLines = (tokens: CodeToken[]): CodeToken[][] => {
    const lines: CodeToken[][] = [[]];

    for (const { kind, text } of tokens) {
        const pieces = text.split('\n');

        pieces.forEach((piece, index) => {
            if (index > 0) {
                lines.push([]);
            }

            if (piece) {
                lines[lines.length - 1]!.push({ kind, text: piece });
            }
        });
    }

    return lines;
};
