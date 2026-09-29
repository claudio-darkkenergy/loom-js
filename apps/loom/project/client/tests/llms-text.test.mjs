import { describe, it } from 'node:test';

import {
    assertLlmsTopics,
    firstSentence,
    llmsFull,
    llmsIndex
} from '../llms-text.mts';
import assert from 'node:assert/strict';

const site = {
    name: 'loom',
    origin: 'https://site.test',
    sections: [
        {
            title: 'Onboarding',
            topics: [
                {
                    lead: 'loom is a framework. It is small.',
                    markdown:
                        'loom is a framework. It is small.\n\n## Install\n\nRun it.',
                    slug: 'getting-started',
                    title: 'Getting Started'
                }
            ]
        },
        {
            title: 'Reactivity',
            topics: [
                {
                    lead: 'Use `a.b` values, e.g. counters. Then more.',
                    markdown:
                        'Use `a.b` values, e.g. counters. Then more.\n\n## API\n\nText.',
                    slug: 'activities',
                    title: 'Activities'
                }
            ]
        }
    ]
};

describe('firstSentence', () => {
    it('stops at the first sentence end', () => {
        assert.equal(
            firstSentence('loom is a framework. It is small.'),
            'loom is a framework.'
        );
    });

    it('reads past periods inside code and abbreviations', () => {
        assert.equal(
            firstSentence('Use `a.b` values, e.g. counters. Then more.'),
            'Use `a.b` values, e.g. counters.'
        );
    });
});

describe('llmsIndex', () => {
    it('lists every topic once, grouped, with absolute addresses', () => {
        assert.equal(
            llmsIndex(site),
            [
                '# loom',
                '',
                '> loom is a framework. It is small.',
                '',
                'Every topic below in one file: https://site.test/llms-full.txt',
                '',
                '## Onboarding',
                '',
                '- [Getting Started](https://site.test/docs/getting-started): loom is a framework.',
                '',
                '## Reactivity',
                '',
                '- [Activities](https://site.test/docs/activities): Use `a.b` values, e.g. counters.',
                ''
            ].join('\n')
        );
    });
});

describe('llmsFull', () => {
    it('writes each topic under its title and address, in order', () => {
        const full = llmsFull(site);

        assert.ok(
            full.indexOf('# Getting Started') < full.indexOf('# Activities')
        );
        assert.ok(
            full.includes(
                '# Activities\n\nSource: https://site.test/docs/activities\n\nUse `a.b` values'
            )
        );
        assert.ok(full.endsWith('Text.\n'));
    });
});

describe('assertLlmsTopics', () => {
    it('passes complete topics', () => {
        assert.doesNotThrow(() => assertLlmsTopics(site.sections));
    });

    it('names a topic with no lead', () => {
        assert.throws(
            () =>
                assertLlmsTopics([
                    {
                        title: '',
                        topics: [
                            {
                                lead: '',
                                markdown: '## Only a heading',
                                slug: 'bare',
                                title: 'Bare'
                            }
                        ]
                    }
                ]),
            /topic "bare" has no lead/
        );
    });

    it('names a topic with no body', () => {
        assert.throws(
            () =>
                assertLlmsTopics([
                    {
                        title: '',
                        topics: [
                            {
                                lead: 'Just this.',
                                markdown: 'Just this.',
                                slug: 'thin',
                                title: 'Thin'
                            }
                        ]
                    }
                ]),
            /topic "thin" has no body/
        );
    });

    it('fails on an empty listing', () => {
        assert.throws(() => assertLlmsTopics([]), /no topics/);
    });
});
