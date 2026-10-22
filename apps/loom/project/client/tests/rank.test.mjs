import { describe, it } from 'node:test';

import { rank, snippet, tokenize } from '../../../src/app/logic/search/rank.ts';
import assert from 'node:assert/strict';

const entry = (overrides) => ({
    anchor: '',
    group: 'Core',
    heading: '',
    level: 0,
    slug: 'topic',
    text: '',
    title: 'Topic',
    ...overrides
});

const entries = [
    entry({
        slug: 'components',
        title: 'Components',
        text: 'A component is a tagged template. Lazy import is mentioned here once.'
    }),
    entry({
        slug: 'lazy-imports',
        title: 'Lazy Imports',
        text: 'Defer heavy code.'
    }),
    entry({
        anchor: 'lazy-import',
        heading: 'lazyImport',
        level: 2,
        slug: 'lazy-imports',
        title: 'Lazy Imports',
        text: 'Takes a key and an importer.'
    }),
    entry({
        slug: 'keyed-lists',
        title: 'Keyed lists',
        text: 'Keyed reconciliation keeps nodes.'
    })
];

describe('tokenize', () => {
    it('lowercases and splits on non-word characters', () => {
        assert.deepEqual(tokenize('  Lazy-Import  key '), [
            'lazy',
            'import',
            'key'
        ]);
    });
});

describe('rank', () => {
    it('ranks a title hit above a heading hit above a text hit', () => {
        const slugs = rank('lazy import', entries).map(
            ({ entry: { slug, anchor } }) => `${slug}#${anchor}`
        );

        assert.deepEqual(slugs, [
            'lazy-imports#',
            'lazy-imports#lazy-import',
            'components#'
        ]);
    });

    it('requires every token to prefix-match somewhere', () => {
        assert.deepEqual(
            rank('keyed lists', entries).map(({ entry: { slug } }) => slug),
            ['keyed-lists']
        );
        assert.deepEqual(rank('keyed zzz', entries), []);
    });

    it('returns nothing for an empty query', () => {
        assert.deepEqual(rank('', entries), []);
        assert.deepEqual(rank('  ', entries), []);
    });

    it('keeps listing order on equal scores and honors the limit', () => {
        const tied = [
            entry({ slug: 'a', title: 'Alpha', text: 'shared word' }),
            entry({ slug: 'b', title: 'Beta', text: 'shared word' }),
            entry({ slug: 'c', title: 'Gamma', text: 'shared word' })
        ];

        assert.deepEqual(
            rank('shared', tied).map(({ entry: { slug } }) => slug),
            ['a', 'b', 'c']
        );
        assert.equal(rank('shared', tied, 2).length, 2);
    });
});

describe('snippet', () => {
    it('returns the sentence holding the first hit', () => {
        assert.equal(
            snippet(entries[0].text, 'lazy'),
            'Lazy import is mentioned here once.'
        );
    });

    it('falls back to the opening text and trims long windows', () => {
        const long = 'word '.repeat(60).trim();

        assert.equal(snippet(long, 'nothing').length, 120);
        assert.ok(snippet(long, 'nothing').endsWith('…'));
    });
});
