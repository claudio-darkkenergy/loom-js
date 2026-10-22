import { describe, it } from 'node:test';

import { assertSearchIndex, searchIndexJson } from '../search-index.mts';
import assert from 'node:assert/strict';

const topics = [
    { slug: 'getting-started', title: 'Getting Started' },
    { slug: 'activities', title: 'Activities' }
];

const entry = (overrides) => ({
    anchor: '',
    group: 'Onboarding',
    heading: '',
    level: 0,
    slug: 'getting-started',
    text: 'loom is a framework.',
    title: 'Getting Started',
    ...overrides
});

const validEntries = [
    entry({}),
    entry({ anchor: 'install', heading: 'Install', level: 2, text: 'Run it.' }),
    entry({ slug: 'activities', title: 'Activities', group: 'Reactivity' })
];

describe('assertSearchIndex', () => {
    it('accepts an index with a lead per listed topic', () => {
        assert.doesNotThrow(() => assertSearchIndex(validEntries, topics));
    });

    it('names a listed topic without a lead entry', () => {
        assert.throws(
            () => assertSearchIndex([validEntries[0]], topics),
            /"activities" has no lead entry/
        );
    });

    it('names a section entry with an empty heading', () => {
        assert.throws(
            () =>
                assertSearchIndex(
                    [...validEntries, entry({ anchor: 'x', level: 2 })],
                    topics
                ),
            /"getting-started" has a section with no heading/
        );
    });

    it('names a duplicate slug + anchor pair', () => {
        assert.throws(
            () => assertSearchIndex([...validEntries, validEntries[1]], topics),
            /"getting-started#install" appears twice/
        );
    });
});

describe('searchIndexJson', () => {
    it('serializes the entries as a compact JSON array', () => {
        const json = searchIndexJson(validEntries);

        assert.equal(JSON.parse(json).length, 3);
        assert.equal(json.includes('\n'), false);
    });
});
