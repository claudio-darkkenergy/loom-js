// The accepted grammar's lexical layer: token classes, the shared name
// reader, and the transform's throw path (parent Decision 6 — malformed
// component syntax fails at transform time, naming the construct).

export const NAME_START = /[A-Za-z_]/;
export const NAME_CHAR = /[A-Za-z0-9_-]/;
export const SEPARATOR = /[\s/>]/;
// Elements that never open a subtree, so they never go onto a tag stack.
export const VOID_TAG =
    /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;

export const BAD_ATTR_INTERPOLATION =
    'unexpected interpolation in the attribute region — an interpolated value must immediately follow `name=`';
export const BAD_SLOT_LABEL =
    'a slot label must be a static, non-empty quoted string';

export const fail: (message: string, near?: string) => never = (
    message,
    near
) => {
    throw new Error(
        `[loom] Component element syntax error: ${message}${
            near ? ` near: \`${near}\`` : ''
        }`
    );
};

export const excerpt = (text: string, at: number) =>
    text.slice(Math.max(0, at - 24), at + 24);

// Consumes an attribute/tag name starting at `from`; returns the exclusive
// end position.
export const readName = (text: string, from: number) => {
    let nameEnd = from;

    while (nameEnd < text.length && NAME_CHAR.test(text[nameEnd] as string)) {
        nameEnd++;
    }

    return nameEnd;
};
