import { makeComponentGetter } from './emit';
import {
    BAD_ATTR_INTERPOLATION,
    BAD_SLOT_LABEL,
    NAME_START,
    SEPARATOR,
    VOID_TAG,
    excerpt,
    fail,
    readName
} from './grammar';
import {
    createRegion,
    mergeRegion,
    pushSlot,
    pushText,
    slotRegionFor
} from './regions';
import type { Frame, PlainTag, Region } from './types';

// The scan state machine: walks the chunks once, delegating each position to
// the scanner that owns it — `scanAttrs` inside a component tag's attribute
// region, `scanPlainTag` inside a plain HTML open tag, `scanText` everywhere
// else. The scanners cooperate over shared state (the open-frame stack and
// the region currently accumulating), which is why they live together here.

// Scans the chunks and returns the root region, fully accumulated.
export const scan = (chunks: ArrayLike<string>, last: number): Region => {
    const root = createRegion();
    const frames: Frame[] = [];
    let region = root;
    let attrsFrame: Frame | null = null;
    let pendingValueName: string | null = null;
    let expectSeparator = false;
    let plainTag: PlainTag | null = null;

    // The open tag has fully parsed — route its buffered text (top level
    // only) and set up the subtree bookkeeping.
    const finishPlainTag = (selfClosed: boolean) => {
        const tag = plainTag as PlainTag;
        const frame = frames[frames.length - 1] as Frame;
        const opensSubtree = !selfClosed && !VOID_TAG.test(tag.name);

        plainTag = null;

        if (tag.buffer) {
            const destination = tag.label
                ? slotRegionFor(frame, tag.label)
                : (frame.region as Region);

            mergeRegion(destination, tag.buffer);
            region = frame.region as Region;

            if (opensSubtree) {
                frame.tagStack.push(tag.name);

                if (tag.label) {
                    frame.activeSlot = tag.label;
                    region = destination;
                }
            }
        } else if (opensSubtree) {
            frame.tagStack.push(tag.name);
        }
    };

    // A plain HTML open tag inside a children region, from `parseFrom` (the
    // scan may span chunk boundaries — interpolated attribute values split
    // the chunks). Emits the consumed text verbatim and returns the position
    // where text scanning resumes, or the chunk length when fully consumed.
    const scanPlainTag = (
        text: string,
        parseFrom: number,
        emitFrom: number,
        chunkIndex: number
    ): number => {
        const tag = plainTag as PlainTag;
        const len = text.length;
        let pos = parseFrom;

        const exit = (at: number) => {
            pushText(region, text.slice(emitFrom, at));
            return at;
        };
        const badLabel = () => fail(BAD_SLOT_LABEL, excerpt(text, pos));

        while (pos < len) {
            const char = text[pos] as string;

            if (tag.quote) {
                const closeQuote = text.indexOf(tag.quote, pos);

                if (closeQuote === -1) {
                    return exit(len);
                }

                tag.quote = null;
                pos = closeQuote + 1;
                continue;
            }

            if (tag.inValue) {
                if (/[\s>]/.test(char)) {
                    tag.inValue = false;
                } else {
                    pos++;
                    continue;
                }
            }

            if (char === '>') {
                pos++;
                exit(pos);
                finishPlainTag(text[pos - 2] === '/');
                return pos;
            }

            if (char === '"' || char === "'") {
                tag.quote = char;
                pos++;
                continue;
            }

            if (tag.buffer && NAME_START.test(char)) {
                const nameEnd = readName(text, pos + 1);
                const isSlot = text.slice(pos, nameEnd) === 'slot';
                const charAfterName = text[nameEnd];

                if (charAfterName === '=') {
                    const valueChar = text[nameEnd + 1];

                    if (valueChar === '"' || valueChar === "'") {
                        if (isSlot) {
                            const closeQuote = text.indexOf(
                                valueChar,
                                nameEnd + 2
                            );
                            const label =
                                closeQuote > -1
                                    ? text.slice(nameEnd + 2, closeQuote)
                                    : '';

                            if (!label) {
                                badLabel();
                            }

                            tag.label = label;
                            pos = closeQuote + 1;
                        } else {
                            tag.quote = valueChar;
                            pos = nameEnd + 2;
                        }

                        continue;
                    }

                    if (valueChar === undefined) {
                        if (isSlot && chunkIndex !== last) {
                            badLabel();
                        }

                        // An interpolated value for an ordinary attribute —
                        // passes through with today's semantics.
                        return exit(len);
                    }

                    if (isSlot) {
                        badLabel();
                    }

                    tag.inValue = true;
                    pos = nameEnd + 1;
                    continue;
                }

                if (
                    isSlot &&
                    (charAfterName !== undefined || chunkIndex !== last)
                ) {
                    // Valueless `slot` is never a legal label.
                    badLabel();
                }

                pos = nameEnd;
                continue;
            }

            pos++;
        }

        return exit(len);
    };

    // Attribute region for the current chunk. Returns the position where text
    // scanning resumes, or the chunk length when fully consumed.
    const scanAttrs = (text: string, chunkIndex: number): number => {
        const frame = attrsFrame as Frame;
        const len = text.length;
        let pos = 0;

        const badLabel = () => fail(BAD_SLOT_LABEL, excerpt(text, pos));

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
                    // Self-closing — emit into the enclosing region, or into
                    // the named region this element's `slot` label addresses.
                    attrsFrame = null;
                    pushSlot(
                        frame.slotLabel
                            ? slotRegionFor(
                                  frames[frames.length - 1] as Frame,
                                  frame.slotLabel
                              )
                            : region,
                        makeComponentGetter(frame)
                    );
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
                const nameEnd = readName(text, pos + 1);

                fail(
                    `component props take no \`$\` sigil — write \`${text.slice(
                        pos + 1,
                        nameEnd
                    )}\`, not \`${text.slice(pos, nameEnd)}\``,
                    excerpt(text, pos)
                );
            }

            if (NAME_START.test(char)) {
                const nameEnd = readName(text, pos + 1);
                const name = text.slice(pos, nameEnd);
                const charAfterName = text[nameEnd];
                // A `slot` prop is a region label only when this element sits
                // at the top level of an enclosing children region.
                const isSlotLabel =
                    name === 'slot' &&
                    frames.length > 0 &&
                    !(frames[frames.length - 1] as Frame).tagStack.length;

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

                        if (isSlotLabel) {
                            // The label is addressing, not a prop — consumed.
                            if (!value) {
                                badLabel();
                            }

                            frame.slotLabel = value;
                        } else {
                            frame.props.push([name, () => value]);
                        }

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

                        if (isSlotLabel) {
                            badLabel();
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
                    if (isSlotLabel) {
                        // Valueless `slot` is never a legal label.
                        badLabel();
                    }

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

        // A plain open tag left unfinished by the previous chunk (an
        // interpolated attribute value split it) — resume it first.
        if (plainTag) {
            pos = scanPlainTag(text, pos, pos, chunkIndex);

            if (plainTag) {
                return false;
            }
        }

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
                attrsFrame = {
                    props: [],
                    region: null,
                    tagIndex: chunkIndex,
                    tagStack: []
                };
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

                    const closedFrame = frame as Frame;
                    const parentFrame = frames.length
                        ? (frames[frames.length - 1] as Frame)
                        : null;

                    // Resume the enclosing region — the labelled sub-region
                    // when the parent is inside a `[slot]`-labelled subtree.
                    region = parentFrame
                        ? parentFrame.activeSlot
                            ? slotRegionFor(parentFrame, parentFrame.activeSlot)
                            : (parentFrame.region as Region)
                        : root;
                    pushSlot(
                        closedFrame.slotLabel && parentFrame
                            ? slotRegionFor(parentFrame, closedFrame.slotLabel)
                            : region,
                        makeComponentGetter(closedFrame)
                    );
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

                if (frames.length) {
                    // A plain HTML end tag inside a children region — pop the
                    // tag stack (to the nearest matching open, so implied
                    // closes recover) and leave a labelled subtree when its
                    // root closes.
                    const frame = frames[frames.length - 1] as Frame;
                    const closeEnd = text.indexOf('>', openAngle + 2);

                    if (closeEnd > -1 && frame.tagStack.length) {
                        const tagName = text
                            .slice(openAngle + 2, closeEnd)
                            .trim()
                            .toLowerCase();
                        const openIndex = frame.tagStack.lastIndexOf(tagName);

                        if (openIndex > -1) {
                            frame.tagStack.length = openIndex;
                        }

                        pushText(region, text.slice(openAngle, closeEnd + 1));

                        if (!frame.tagStack.length && frame.activeSlot) {
                            frame.activeSlot = null;
                            region = frame.region as Region;
                        }

                        pos = closeEnd + 1;
                        continue;
                    }
                }

                // A plain HTML end tag (or trailing text) — passes through.
                pushText(region, '</');
                pos = openAngle + 2;
                continue;
            }

            if (frames.length && NAME_START.test(nextChar)) {
                // A plain HTML open tag inside a children region — scanned
                // for depth (and, at the region's top level, a slot label).
                const nameEnd = readName(text, openAngle + 2);
                const atTop = !(frames[frames.length - 1] as Frame).tagStack
                    .length;

                plainTag = {
                    buffer: atTop ? createRegion() : null,
                    name: text.slice(openAngle + 1, nameEnd).toLowerCase()
                };

                if (plainTag.buffer) {
                    region = plainTag.buffer;
                }

                pos = scanPlainTag(text, nameEnd, openAngle, chunkIndex);

                if (plainTag) {
                    return false;
                }

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

    return root;
};
