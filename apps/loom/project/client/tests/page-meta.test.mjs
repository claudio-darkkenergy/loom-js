import { describe, it } from 'node:test';

import {
    DESCRIPTION_MAX_LENGTH,
    markdownToPlainText,
    topicDescription
} from '../page-meta.mts';
import assert from 'node:assert/strict';

describe('markdownToPlainText', () => {
    it('keeps link text, code and emphasis content', () => {
        assert.equal(
            markdownToPlainText(
                'Call [`init`](/docs/bootstrapping) **once**, then _render_.'
            ),
            'Call init once, then render.'
        );
    });

    it('leaves snake_case and lone asterisks alone', () => {
        assert.equal(
            markdownToPlainText('Use snake_case_names * 2'),
            'Use snake_case_names * 2'
        );
    });
});

describe('topicDescription', () => {
    it('returns a short lead whole', () => {
        assert.equal(topicDescription('A short lead.'), 'A short lead.');
    });

    it('cuts a long lead at a word boundary with an ellipsis', () => {
        const description = topicDescription('word '.repeat(60));

        assert.ok(description.length <= DESCRIPTION_MAX_LENGTH);
        assert.match(description, /word…$/);
    });

    it('is empty without a lead', () => {
        assert.equal(topicDescription(''), '');
    });
});
