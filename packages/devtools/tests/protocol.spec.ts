import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
    ENTRY_CAP,
    MISSING,
    STRING_CAP,
    encodeValue,
    resolvePath
} from '../src/protocol/encode';
import { createTransport, envelope } from '../src/protocol/transport';

// Specs for the `devtools-protocol` capability's pure parts: value encoding
// and path expansion, and the transport's origin / source / tag checks.

const encode = (value: unknown) => encodeValue(value, () => undefined);

describe('value encoding', () => {
    it('encodes primitives and number edge cases', () => {
        expect(encode(undefined)).to.deep.equal({ t: 'undefined' });
        expect(encode(null)).to.deep.equal({ t: 'null' });
        expect(encode(true)).to.deep.equal({ t: 'bool', v: true });
        expect(encode(3)).to.deep.equal({ t: 'num', v: 3 });
        expect(encode(-0)).to.deep.equal({ t: 'num', v: '-0' });
        expect(encode(NaN)).to.deep.equal({ t: 'num', v: 'NaN' });
        expect(encode(-Infinity)).to.deep.equal({ t: 'num', v: '-Infinity' });
        expect(encode(10n)).to.deep.equal({ t: 'bigint', v: '10' });
        expect(encode(Symbol('s'))).to.deep.equal({ t: 'symbol', v: 's' });
    });

    it('truncates long strings and names functions', () => {
        const long = 'x'.repeat(STRING_CAP + 10);

        expect(encode(long)).to.deep.equal({
            length: STRING_CAP + 10,
            t: 'str',
            v: 'x'.repeat(STRING_CAP)
        });
        expect(encode(function namedFn() {})).to.deep.equal({
            name: 'namedFn',
            t: 'fn'
        });
    });

    it('encodes dates, errors, promises and class instances', () => {
        class Point {
            x = 1;
        }

        expect(encode(new Date(0))).to.deep.equal({
            t: 'date',
            v: '1970-01-01T00:00:00.000Z'
        });
        expect(encode(new TypeError('bad'))).to.deep.equal({
            message: 'bad',
            name: 'TypeError',
            t: 'error'
        });
        expect(encode(Promise.resolve())).to.deep.equal({ t: 'promise' });
        expect(encode(new Point())).to.include({ ctor: 'Point', size: 1 });
    });

    it('inlines two levels and leaves deeper parts to path expansion', () => {
        const encoded = encode({ a: { b: { c: 1 } } });

        expect(encoded).to.deep.equal({
            ctor: undefined,
            entries: [
                [
                    'a',
                    {
                        ctor: undefined,
                        entries: [
                            [
                                'b',
                                {
                                    ctor: undefined,
                                    entries: undefined,
                                    size: 1,
                                    t: 'object'
                                }
                            ]
                        ],
                        size: 1,
                        t: 'object'
                    }
                ]
            ],
            size: 1,
            t: 'object'
        });
    });

    it('caps collections and expands further by path', () => {
        const items = Array.from({ length: 5000 }, (_, index) => index);
        const encoded = encode(items);

        expect(encoded).to.include({ length: 5000, t: 'array' });
        expect((encoded as { items: unknown[] }).items).to.have.length(
            ENTRY_CAP
        );
        expect(resolvePath(items, [4321])).to.equal(4321);
    });

    it('encodes maps and sets with their entries', () => {
        expect(encode(new Map([['k', 1]]))).to.deep.equal({
            entries: [
                [
                    { t: 'str', v: 'k' },
                    { t: 'num', v: 1 }
                ]
            ],
            size: 1,
            t: 'map'
        });
        expect(encode(new Set(['v']))).to.deep.equal({
            entries: [[{ t: 'undefined' }, { t: 'str', v: 'v' }]],
            size: 1,
            t: 'set'
        });
    });

    it('marks cycles and unreadable values instead of failing', () => {
        const cyclic: Record<string, unknown> = { name: 'loop' };

        cyclic.self = cyclic;

        const hostile = {
            get boom() {
                throw new Error('no');
            }
        };

        expect(
            (encode(cyclic) as { entries: [string, unknown][] }).entries
        ).to.deep.include(['self', { t: 'circular' }]);
        expect(
            (encode(hostile) as { entries: [string, unknown][] }).entries
        ).to.deep.equal([['boom', { t: 'unserializable' }]]);
    });

    it('lets framework values describe themselves first', () => {
        const marker = {};

        expect(
            encodeValue({ marker }, (value) =>
                value === marker ? { name: 'Card', t: 'component' } : undefined
            )
        ).to.deep.include({
            entries: [['marker', { name: 'Card', t: 'component' }]]
        });
    });
});

describe('path resolution', () => {
    it('follows keys, indices and collection entries', () => {
        const value = {
            list: [{ deep: 'yes' }],
            map: new Map([['a', 'map-value']]),
            set: new Set(['set-value'])
        };

        expect(resolvePath(value, ['list', 0, 'deep'])).to.equal('yes');
        expect(resolvePath(value, ['map', 0])).to.equal('map-value');
        expect(resolvePath(value, ['set', 0])).to.equal('set-value');
        expect(resolvePath(value, ['missing'])).to.equal(MISSING);
        expect(resolvePath(value, ['set', 5])).to.equal(MISSING);
    });
});

describe('transport', () => {
    const fire = (
        data: unknown,
        origin = window.origin,
        source: Window = window
    ) =>
        window.dispatchEvent(
            new MessageEvent('message', { data, origin, source })
        );
    const valid = envelope({ kind: 'request', session: 's', type: 'hello' });

    it('accepts a same-origin envelope from a peer', () => {
        const onMessage = sinon.spy();
        const stop = createTransport(window).listen(() => true, onMessage);

        fire(valid);
        stop();
        expect(onMessage.calledOnceWith(valid, window)).to.be.true;
    });

    it('ignores foreign data, other origins and non-peers', () => {
        const onMessage = sinon.spy();
        const stop = createTransport(window).listen(
            (source) => source === window,
            onMessage
        );
        const frame = document.createElement('iframe');

        document.body.append(frame);
        fire({ hello: true });
        fire({ ...valid, source: 'someone-else' });
        fire(valid, 'https://elsewhere.test');
        fire(valid, window.origin, frame.contentWindow!);
        stop();
        frame.remove();
        expect(onMessage.called).to.be.false;
    });
});
