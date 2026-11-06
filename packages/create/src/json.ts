// JSON as both formatters print it: one key per line, short primitive arrays
// inline. `package.json` is the file both special-case (see `toPackageJson`).
const INDENT = '    ';
const LINE_WIDTH = 80;

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const isPrimitive = (value: Json) =>
    value === null || typeof value !== 'object';

const print = (value: Json, depth: number, prefixLength: number): string => {
    if (isPrimitive(value)) {
        return JSON.stringify(value);
    }

    const inner = INDENT.repeat(depth + 1);
    const outer = INDENT.repeat(depth);

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return '[]';
        }

        const inline = `[${value.map((item) => print(item, 0, 0)).join(', ')}]`;

        // `prefixLength` counts what precedes the array on its line, and the
        // `,` that may follow it.
        if (
            value.every(isPrimitive) &&
            prefixLength + inline.length + 1 <= LINE_WIDTH
        ) {
            return inline;
        }

        const items = value.map(
            (item) => `${inner}${print(item, depth + 1, inner.length)}`
        );

        return `[\n${items.join(',\n')}\n${outer}]`;
    }

    const entries = Object.entries(value);

    if (entries.length === 0) {
        return '{}';
    }

    const lines = entries.map(([key, item]) => {
        const keyText = `${inner}${JSON.stringify(key)}: `;

        return `${keyText}${print(item, depth + 1, keyText.length)}`;
    });

    return `{\n${lines.join(',\n')}\n${outer}}`;
};

/** A JSON file's text, formatter-canonical, with a trailing newline. */
export const toJson = (value: object) => `${print(value as Json, 0, 0)}\n`;

/** `package.json` text: every array expanded, as both formatters keep it. */
export const toPackageJson = (value: object) =>
    `${JSON.stringify(value, null, 4)}\n`;
