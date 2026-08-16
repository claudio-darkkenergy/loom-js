import { Linter } from 'eslint';
import { describe, it } from 'node:test';

import loom from '../dist/index.js';
import assert from 'node:assert/strict';

const fixture = `export const Page = ({ html }) => html\`
    <main>
        \${Chip({ label: 'hi' })}
        <\${Button} $click=\${handler}>Go</\${Button}>
    </main>
\`;
`;

describe('recommended flat config', () => {
    it('reports both rules at error with no further wiring', () => {
        const linter = new Linter();
        const messages = linter.verify(fixture, [
            loom.configs.recommended,
            { languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } }
        ]);

        assert.deepEqual(messages.map(({ ruleId }) => ruleId).sort(), [
            'loom/no-dollar-props-on-component-tags',
            'loom/prefer-element-syntax'
        ]);

        for (const message of messages) {
            assert.equal(message.severity, 2);
        }
    });
});
