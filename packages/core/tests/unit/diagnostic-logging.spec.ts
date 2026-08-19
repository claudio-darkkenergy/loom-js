import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { canDebug, setDebug } from '../../src/config';
import { loomConsole } from '../../src/lib/globals/loom-console';

// Specs for the `diagnostic-logging` capability (`improve-loom-console`):
// warnings/errors always surface, debug channels are opt-in and silent by
// default, methods resolve to bound natives (attribution) or a shared no-op,
// and the gate is read at property-access time.

describe('diagnostic logging (loomConsole)', () => {
    let consoleStubs: {
        error: sinon.SinonStub;
        info: sinon.SinonStub;
        log: sinon.SinonStub;
        warn: sinon.SinonStub;
    };

    beforeEach(() => {
        consoleStubs = {
            error: sinon.stub(globalThis.console, 'error'),
            info: sinon.stub(globalThis.console, 'info'),
            log: sinon.stub(globalThis.console, 'log'),
            warn: sinon.stub(globalThis.console, 'warn')
        };
    });

    afterEach(() => {
        setDebug(false);
        sinon.restore();
    });

    describe('warnings and errors always surface', () => {
        it('should pass `warn` through with debug off', () => {
            loomConsole.warn('attr misuse');

            expect(consoleStubs.warn.callCount).to.equal(1);
            expect(consoleStubs.warn.firstCall.args).to.deep.equal([
                'attr misuse'
            ]);
        });

        it('should pass `error` through with debug off', () => {
            loomConsole.error('framework error');

            expect(consoleStubs.error.callCount).to.equal(1);
            expect(consoleStubs.error.firstCall.args).to.deep.equal([
                'framework error'
            ]);
        });

        it('should pass `warn` through in a production build, while debug channels stay silent', () => {
            const globalWithProcess = globalThis as {
                process?: { env: { NODE_ENV?: string } };
            };
            const originalProcess = globalWithProcess.process;

            globalWithProcess.process = { env: { NODE_ENV: 'production' } };
            setDebug(true, { updates: true });

            try {
                loomConsole.warn('settlement expiry');
                canDebug('updates') && loomConsole.info('updates narration');

                expect(consoleStubs.warn.callCount).to.equal(1);
                expect(consoleStubs.info.callCount).to.equal(0);
            } finally {
                if (originalProcess === undefined) {
                    delete globalWithProcess.process;
                } else {
                    globalWithProcess.process = originalProcess;
                }
            }
        });
    });

    describe('debug channels are opt-in, scoped, and silent by default', () => {
        it('should treat info/log/group methods as no-ops with debug off', () => {
            loomConsole.info('narration');
            loomConsole.log('narration');
            loomConsole.groupCollapsed('loom (Updating...)');
            loomConsole.groupEnd();

            expect(consoleStubs.info.callCount).to.equal(0);
            expect(consoleStubs.log.callCount).to.equal(0);
        });

        it('should emit only the enabled scope`s narration', () => {
            setDebug(true, { updates: true });

            // Mirrors the framework call-site convention: every narration
            // call site carries its own scope guard.
            canDebug('updates') && loomConsole.info('updates narration');
            canDebug('mutations') && loomConsole.info('mutations narration');

            expect(consoleStubs.info.callCount).to.equal(1);
            expect(consoleStubs.info.firstCall.args).to.deep.equal([
                'updates narration'
            ]);
        });

        it('should read the gate state at access time', () => {
            loomConsole.info('before enabling');
            setDebug(true, { updates: true });
            loomConsole.info('after enabling');
            setDebug(false);
            loomConsole.info('after disabling');

            expect(consoleStubs.info.callCount).to.equal(1);
            expect(consoleStubs.info.firstCall.args).to.deep.equal([
                'after enabling'
            ]);
        });
    });

    describe('call-site attribution', () => {
        it('should resolve `warn` to a bound native console method, not a wrapper closure', () => {
            const boundWarn = loomConsole.warn;

            // A `Function.prototype.bind` product of the console method — the
            // browser attributes its calls to the caller's frame. (The exact
            // name is `bound ` + the method's name, which is empty here
            // because `beforeEach` stubbed it with an anonymous function.)
            expect(boundWarn.name).to.match(/^bound /);

            boundWarn('bound call');
            expect(consoleStubs.warn.callCount).to.equal(1);
            expect(consoleStubs.warn.firstCall.args).to.deep.equal([
                'bound call'
            ]);
        });

        it('should resolve every closed-gate method to the same shared no-op', () => {
            expect(loomConsole.info).to.equal(loomConsole.log);
            expect(loomConsole.info).to.equal(loomConsole.groupCollapsed);
            expect(loomConsole.info).to.equal(loomConsole.groupEnd);
        });
    });
});
