// Boot-contract tests: the shell slots and the prerender injector that fills
// them. Node lane, against the built `dist/` entries. Run via
// `pnpm test-server`.
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

const browserEntry = await import('../../dist/index.mjs');
const { APP_ROOT_ID, STATE_SCRIPT_ID, appRootSlot, stateScriptSlot } =
    browserEntry;
const { injectPrerender, ...serverEntry } =
    await import('../../dist/server.mjs');

const shell = `<!doctype html><html><body>\n    ${appRootSlot}\n    ${stateScriptSlot}\n</body></html>`;

describe('boot contract', () => {
    it('exposes the same ids and slots from both entries', () => {
        assert.equal(serverEntry.APP_ROOT_ID, APP_ROOT_ID);
        assert.equal(serverEntry.STATE_SCRIPT_ID, STATE_SCRIPT_ID);
        assert.equal(serverEntry.appRootSlot, appRootSlot);
        assert.equal(serverEntry.stateScriptSlot, stateScriptSlot);
        assert.match(appRootSlot, new RegExp(`id="${APP_ROOT_ID}"`));
        assert.match(stateScriptSlot, new RegExp(`id="${STATE_SCRIPT_ID}"`));
    });

    it('fills both slots, keeping `$` sequences verbatim', () => {
        const injected = injectPrerender(shell, {
            appHtml: '<main>cost: $1 and $& and $`</main>',
            stateJson: '{"state":{"k":"$$"}}'
        });

        assert.ok(
            injected.includes(
                `<div id="${APP_ROOT_ID}" style="height: 100%"><main>cost: $1 and $& and $\`</main></div>`
            )
        );
        assert.ok(
            injected.includes(
                `<script id="${STATE_SCRIPT_ID}" type="application/json">{"state":{"k":"$$"}}</script>`
            )
        );
        assert.ok(!injected.includes(appRootSlot));
        assert.ok(!injected.includes(stateScriptSlot));
    });

    it('throws on a shell missing a boot slot', () => {
        for (const drifted of [
            shell.replace(appRootSlot, '<div id="app"></div>'),
            shell.replace(stateScriptSlot, '')
        ]) {
            assert.throws(
                () => injectPrerender(drifted, { appHtml: '', stateJson: '' }),
                /missing a boot slot/
            );
        }
    });
});
