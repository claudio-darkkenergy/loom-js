import { component } from '../../component';
import type {
    Component,
    ComponentContext,
    PlainObject,
    TemplateTagValue,
    TemplateTransformGetter,
    TemplateTransformPlan
} from '../../types';

// Compiles component-element syntax (`<${Component} …/>`) out of a template's
// chunks, per the accepted grammar in
// `openspec/changes/add-template-component-syntax/design.md`. Returns `null`
// when the template contains no component tags — the caller must then use the
// original chunks untouched.

const NAME_START = /[A-Za-z_]/;
const NAME_CHAR = /[A-Za-z0-9_-]/;
const SEPARATOR = /[\s/>]/;

interface Region {
    getters: TemplateTransformGetter[];
    statics: string[];
}

// A component element mid-parse: its attribute region until `/>` or `>`, then
// (non-self-closing only) its children region until the matching `</>`.
interface Frame {
    props: [string, TemplateTransformGetter][];
    region: Region | null;
    tagIndex: number;
}

const fail: (message: string, near?: string) => never = (message, near) => {
    throw new Error(
        `[loom] Component element syntax error: ${message}${
            near ? ` near: \`${near}\`` : ''
        }`
    );
};

const BAD_ATTR_INTERPOLATION =
    'unexpected interpolation in the attribute region — an interpolated value must immediately follow `name=`';

const excerpt = (text: string, at: number) =>
    text.slice(Math.max(0, at - 24), at + 24);

const createRegion = (): Region => ({ getters: [], statics: [''] });

const pushText = (region: Region, text: string) => {
    region.statics[region.statics.length - 1] += text;
};

const pushSlot = (region: Region, getter: TemplateTransformGetter) => {
    region.getters.push(getter);
    region.statics.push('');
};

// A children region has no single-root guarantee (text, multiple elements),
// so its synthesized component always renders as a rootless fragment.
const makeChildrenComponent = (region: Region) => {
    region.statics[0] = `<>${region.statics[0]}`;

    const childChunks = region.statics;
    const synth = component<{ values?: TemplateTagValue[] }>(
        (html, { values = [] }) =>
            (
                html as unknown as (
                    chunks: string[],
                    ...values: TemplateTagValue[]
                ) => ComponentContext
            )(childChunks, ...values)
    );

    return { getters: region.getters, synth };
};

const makeComponentGetter = (frame: Frame): TemplateTransformGetter => {
    const { props, region, tagIndex } = frame;
    const child =
        region &&
        (region.getters.length || region.statics.some((text) => text.trim()))
            ? makeChildrenComponent(region)
            : null;

    return (interpolations) => {
        const tag = interpolations[tagIndex];

        if (typeof tag !== 'function') {
            fail(
                `the component tag value at interpolation #${tagIndex} is not callable`
            );
        }

        const tagProps: PlainObject = {};

        props.forEach(([name, get]) => {
            tagProps[name] = get(interpolations);
        });

        if (child) {
            tagProps.children = child.synth({
                values: child.getters.map((get) => get(interpolations))
            });
        }

        return (tag as Component)(tagProps);
    };
};

export const compileComponentTags = (
    chunks: ArrayLike<string>
): TemplateTransformPlan | null => {
    const last = chunks.length - 1;
    let hasSignal = false;

    // Fast bail-out (Decision 4): only a chunk ending in `<` or `</`
    // immediately before an interpolation can open component syntax.
    for (let chunkIndex = 0; chunkIndex < last; chunkIndex++) {
        const chunk = chunks[chunkIndex] as string;

        if (chunk.endsWith('<') || chunk.endsWith('</')) {
            hasSignal = true;
            break;
        }
    }

    if (!hasSignal) {
        return null;
    }

    const root = createRegion();
    const frames: Frame[] = [];
    let region = root;
    let attrsFrame: Frame | null = null;
    let pendingValueName: string | null = null;
    let expectSeparator = false;

    // Attribute region for the current chunk. Returns the position where text
    // scanning resumes, or the chunk length when fully consumed.
    const scanAttrs = (text: string, chunkIndex: number): number => {
        const frame = attrsFrame as Frame;
        const len = text.length;
        let pos = 0;

        if (expectSeparator) {
            const char = text[pos];

            if (char !== undefined && !SEPARATOR.test(char)) {
                fail(
                    'the component tag and interpolated prop values must be followed by whitespace, `/>`, or `>`',
                    excerpt(text, 0)
                );
            }

            expectSeparator = false;
        }

        while (pos < len) {
            const char = text[pos] as string;

            if (/\s/.test(char)) {
                pos++;
                continue;
            }

            if (char === '/') {
                if (text[pos + 1] === '>') {
                    // Self-closing — emit into the enclosing region.
                    attrsFrame = null;
                    pushSlot(region, makeComponentGetter(frame));
                    return pos + 2;
                }

                fail(
                    'unexpected `/` in the attribute region',
                    excerpt(text, pos)
                );
            }

            if (char === '>') {
                // Open with children — the frame goes onto the stack.
                frame.region = createRegion();
                frames.push(frame);
                region = frame.region;
                attrsFrame = null;
                return pos + 1;
            }

            if (char === '$') {
                let nameEnd = pos + 1;

                while (
                    nameEnd < len &&
                    NAME_CHAR.test(text[nameEnd] as string)
                ) {
                    nameEnd++;
                }

                fail(
                    `component props take no \`$\` sigil — write \`${text.slice(
                        pos + 1,
                        nameEnd
                    )}\`, not \`${text.slice(pos, nameEnd)}\``,
                    excerpt(text, pos)
                );
            }

            if (NAME_START.test(char)) {
                let nameEnd = pos + 1;

                while (
                    nameEnd < len &&
                    NAME_CHAR.test(text[nameEnd] as string)
                ) {
                    nameEnd++;
                }

                const name = text.slice(pos, nameEnd);
                const charAfterName = text[nameEnd];

                if (charAfterName === '=') {
                    const valueChar = text[nameEnd + 1];

                    if (valueChar === '"' || valueChar === "'") {
                        const closeQuote = text.indexOf(valueChar, nameEnd + 2);

                        if (closeQuote === -1) {
                            fail(
                                'a quoted attribute value must open and close within the same chunk (no interpolations inside quotes)',
                                excerpt(text, nameEnd)
                            );
                        }

                        // The value is a raw JS string — no entity decoding.
                        const value = text.slice(nameEnd + 2, closeQuote);

                        frame.props.push([name, () => value]);
                        pos = closeQuote + 1;
                        continue;
                    }

                    if (nameEnd + 1 === len) {
                        if (chunkIndex === last) {
                            fail(
                                'unterminated component element',
                                excerpt(text, pos)
                            );
                        }

                        // `name=` at the chunk end — the interpolation that
                        // follows is this prop's value.
                        pendingValueName = name;
                        return len;
                    }

                    fail(
                        `unquoted attribute value for \`${name}\` — use quotes or an interpolation`,
                        excerpt(text, nameEnd)
                    );
                }

                if (charAfterName === undefined) {
                    if (chunkIndex === last) {
                        fail(
                            'unterminated component element',
                            excerpt(text, pos)
                        );
                    }

                    return fail(BAD_ATTR_INTERPOLATION, excerpt(text, pos));
                }

                if (SEPARATOR.test(charAfterName)) {
                    // Boolean shorthand.
                    frame.props.push([name, () => true]);
                    pos = nameEnd;
                    continue;
                }

                fail(
                    `unexpected character \`${charAfterName}\` after attribute \`${name}\``,
                    excerpt(text, nameEnd)
                );
            }

            fail(
                `unexpected character \`${char}\` in the attribute region`,
                excerpt(text, pos)
            );
        }

        if (chunkIndex === last) {
            fail('unterminated component element', excerpt(text, len - 1));
        }

        return fail(BAD_ATTR_INTERPOLATION, excerpt(text, len - 1));
    };

    // Text position for the current chunk. Returns `true` when the chunk ends
    // by opening a component tag (consuming the following interpolation).
    const scanText = (
        text: string,
        from: number,
        chunkIndex: number
    ): boolean => {
        const len = text.length;
        let pos = from;

        while (pos < len) {
            const openAngle = text.indexOf('<', pos);

            if (openAngle === -1) {
                pushText(region, text.slice(pos));
                return false;
            }

            pushText(region, text.slice(pos, openAngle));

            const nextChar = text[openAngle + 1];

            if (nextChar === undefined) {
                if (chunkIndex === last) {
                    pushText(region, '<');
                    return false;
                }

                // Component open tag (Decision 4).
                attrsFrame = { props: [], region: null, tagIndex: chunkIndex };
                expectSeparator = true;
                return true;
            }

            if (nextChar === '/') {
                const charAfterSlash = text[openAngle + 2];

                if (charAfterSlash === '>') {
                    // `</>` — close the innermost open component (Decision 5).
                    const frame = frames.pop();

                    if (!frame) {
                        fail(
                            'unmatched `</>` — no component element is open',
                            excerpt(text, openAngle)
                        );
                    }

                    region = frames.length
                        ? ((frames[frames.length - 1] as Frame)
                              .region as Region)
                        : root;
                    pushSlot(region, makeComponentGetter(frame as Frame));
                    pos = openAngle + 3;
                    continue;
                }

                if (charAfterSlash === '/') {
                    fail(
                        '`<//>` is not an accepted closing form — close with `</>`',
                        excerpt(text, openAngle)
                    );
                }

                if (charAfterSlash === undefined && chunkIndex !== last) {
                    fail(
                        '`</${…}>` is not an accepted closing form — close with `</>`',
                        excerpt(text, openAngle)
                    );
                }

                // A plain HTML end tag (or trailing text) — passes through.
                pushText(region, '</');
                pos = openAngle + 2;
                continue;
            }

            pushText(region, '<');
            pos = openAngle + 1;
        }

        return false;
    };

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const text = chunks[chunkIndex] as string;
        let from = 0;
        let openedTag = false;

        if (attrsFrame) {
            if (pendingValueName) {
                // The interpolation before this chunk was a prop value.
                const valueIndex = chunkIndex - 1;
                const name = pendingValueName;

                (attrsFrame as Frame).props.push([
                    name,
                    (interpolations) => interpolations[valueIndex]
                ]);
                pendingValueName = null;
                expectSeparator = true;
            }

            from = scanAttrs(text, chunkIndex);
        }

        if (!attrsFrame) {
            openedTag = scanText(text, from, chunkIndex);
        }

        if (chunkIndex < last && !openedTag && !attrsFrame) {
            // An ordinary interpolation — passes through untouched.
            const valueIndex = chunkIndex;

            pushSlot(region, (interpolations) => interpolations[valueIndex]);
        }
    }

    if (frames.length) {
        fail('unclosed component element — expected `</>`');
    }

    // A template whose top level is only component elements (and whitespace)
    // has no root element left — render it as a rootless fragment.
    if (root.statics.every((text) => !text.trim())) {
        root.statics[0] = `<>${root.statics[0]}`;
    }

    return { chunks: root.statics, getters: root.getters };
};
