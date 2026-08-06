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
                    ...v: TemplateTagValue[]
                ) => ComponentContext
            )(childChunks, ...values)
    );

    return { getters: region.getters, synth };
};

const makeComponentGetter = (frame: Frame): TemplateTransformGetter => {
    const { props, region, tagIndex } = frame;
    const child =
        region &&
        (region.getters.length || region.statics.some((s) => s.trim()))
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
    for (let i = 0; i < last; i++) {
        const chunk = chunks[i] as string;

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
    const scanAttrs = (text: string, i: number): number => {
        const frame = attrsFrame as Frame;
        const len = text.length;
        let p = 0;

        if (expectSeparator) {
            const c = text[p];

            if (c !== undefined && !SEPARATOR.test(c)) {
                fail(
                    'the component tag and interpolated prop values must be followed by whitespace, `/>`, or `>`',
                    excerpt(text, 0)
                );
            }

            expectSeparator = false;
        }

        while (p < len) {
            const c = text[p] as string;

            if (/\s/.test(c)) {
                p++;
                continue;
            }

            if (c === '/') {
                if (text[p + 1] === '>') {
                    // Self-closing — emit into the enclosing region.
                    attrsFrame = null;
                    pushSlot(region, makeComponentGetter(frame));
                    return p + 2;
                }

                fail(
                    'unexpected `/` in the attribute region',
                    excerpt(text, p)
                );
            }

            if (c === '>') {
                // Open with children — the frame goes onto the stack.
                frame.region = createRegion();
                frames.push(frame);
                region = frame.region;
                attrsFrame = null;
                return p + 1;
            }

            if (c === '$') {
                let q = p + 1;

                while (q < len && NAME_CHAR.test(text[q] as string)) {
                    q++;
                }

                fail(
                    `component props take no \`$\` sigil — write \`${text.slice(
                        p + 1,
                        q
                    )}\`, not \`${text.slice(p, q)}\``,
                    excerpt(text, p)
                );
            }

            if (NAME_START.test(c)) {
                let q = p + 1;

                while (q < len && NAME_CHAR.test(text[q] as string)) {
                    q++;
                }

                const name = text.slice(p, q);
                const d = text[q];

                if (d === '=') {
                    const e = text[q + 1];

                    if (e === '"' || e === "'") {
                        const close = text.indexOf(e, q + 2);

                        if (close === -1) {
                            fail(
                                'a quoted attribute value must open and close within the same chunk (no interpolations inside quotes)',
                                excerpt(text, q)
                            );
                        }

                        // The value is a raw JS string — no entity decoding.
                        const value = text.slice(q + 2, close);

                        frame.props.push([name, () => value]);
                        p = close + 1;
                        continue;
                    }

                    if (q + 1 === len) {
                        if (i === last) {
                            fail(
                                'unterminated component element',
                                excerpt(text, p)
                            );
                        }

                        // `name=` at the chunk end — the interpolation that
                        // follows is this prop's value.
                        pendingValueName = name;
                        return len;
                    }

                    fail(
                        `unquoted attribute value for \`${name}\` — use quotes or an interpolation`,
                        excerpt(text, q)
                    );
                }

                if (d === undefined) {
                    if (i === last) {
                        fail(
                            'unterminated component element',
                            excerpt(text, p)
                        );
                    }

                    return fail(BAD_ATTR_INTERPOLATION, excerpt(text, p));
                }

                if (SEPARATOR.test(d)) {
                    // Boolean shorthand.
                    frame.props.push([name, () => true]);
                    p = q;
                    continue;
                }

                fail(
                    `unexpected character \`${d}\` after attribute \`${name}\``,
                    excerpt(text, q)
                );
            }

            fail(
                `unexpected character \`${c}\` in the attribute region`,
                excerpt(text, p)
            );
        }

        if (i === last) {
            fail('unterminated component element', excerpt(text, len - 1));
        }

        return fail(BAD_ATTR_INTERPOLATION, excerpt(text, len - 1));
    };

    // Text position for the current chunk. Returns `true` when the chunk ends
    // by opening a component tag (consuming the following interpolation).
    const scanText = (text: string, from: number, i: number): boolean => {
        const len = text.length;
        let p = from;

        while (p < len) {
            const lt = text.indexOf('<', p);

            if (lt === -1) {
                pushText(region, text.slice(p));
                return false;
            }

            pushText(region, text.slice(p, lt));

            const next = text[lt + 1];

            if (next === undefined) {
                if (i === last) {
                    pushText(region, '<');
                    return false;
                }

                // Component open tag (Decision 4).
                attrsFrame = { props: [], region: null, tagIndex: i };
                expectSeparator = true;
                return true;
            }

            if (next === '/') {
                const c2 = text[lt + 2];

                if (c2 === '>') {
                    // `</>` — close the innermost open component (Decision 5).
                    const frame = frames.pop();

                    if (!frame) {
                        fail(
                            'unmatched `</>` — no component element is open',
                            excerpt(text, lt)
                        );
                    }

                    region = frames.length
                        ? ((frames[frames.length - 1] as Frame)
                              .region as Region)
                        : root;
                    pushSlot(region, makeComponentGetter(frame as Frame));
                    p = lt + 3;
                    continue;
                }

                if (c2 === '/') {
                    fail(
                        '`<//>` is not an accepted closing form — close with `</>`',
                        excerpt(text, lt)
                    );
                }

                if (c2 === undefined && i !== last) {
                    fail(
                        '`</${…}>` is not an accepted closing form — close with `</>`',
                        excerpt(text, lt)
                    );
                }

                // A plain HTML end tag (or trailing text) — passes through.
                pushText(region, '</');
                p = lt + 2;
                continue;
            }

            pushText(region, '<');
            p = lt + 1;
        }

        return false;
    };

    for (let i = 0; i < chunks.length; i++) {
        const text = chunks[i] as string;
        let from = 0;
        let openedTag = false;

        if (attrsFrame) {
            if (pendingValueName) {
                // The interpolation before this chunk was a prop value.
                const valueIndex = i - 1;
                const name = pendingValueName;

                (attrsFrame as Frame).props.push([
                    name,
                    (interpolations) => interpolations[valueIndex]
                ]);
                pendingValueName = null;
                expectSeparator = true;
            }

            from = scanAttrs(text, i);
        }

        if (!attrsFrame) {
            openedTag = scanText(text, from, i);
        }

        if (i < last && !openedTag && !attrsFrame) {
            // An ordinary interpolation — passes through untouched.
            const valueIndex = i;

            pushSlot(region, (interpolations) => interpolations[valueIndex]);
        }
    }

    if (frames.length) {
        fail('unclosed component element — expected `</>`');
    }

    // A template whose top level is only component elements (and whitespace)
    // has no root element left — render it as a rootless fragment.
    if (root.statics.every((s) => !s.trim())) {
        root.statics[0] = `<>${root.statics[0]}`;
    }

    return { chunks: root.statics, getters: root.getters };
};
