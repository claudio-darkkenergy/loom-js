import { expect } from '@esm-bundle/chai';

import { activity, settled } from '../../src';
import { DomWindow, withWindow } from '../../src/lib/dom';

describe('settled', () => {
    it('should resolve after at most one macrotask when no async work is pending', async () => {
        let macrotasksElapsed = 0;
        const countMacrotask = () => {
            macrotasksElapsed++;
            macrotasksElapsed < 5 && setTimeout(countMacrotask);
        };

        setTimeout(countMacrotask);
        await settled();

        expect(macrotasksElapsed).to.be.at.most(1);
    });

    it('should not resolve while a transform thenable is pending, and resolve once it settles', async () => {
        let releaseTransform!: () => void;
        const transformGate = new Promise<void>(
            (resolve) => (releaseTransform = resolve)
        );
        const asyncActivity = activity<string>(
            'initial',
            async ({ input, update }) => {
                await transformGate;
                update(input);
            }
        );
        let settledResolved = false;

        asyncActivity.update('updated');

        const settledPromise = settled().then(() => {
            settledResolved = true;
        });

        // Give an incorrect implementation ample macrotasks to resolve early.
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(settledResolved).to.be.false;

        releaseTransform();
        await settledPromise;
        expect(asyncActivity.value()).to.equal('updated');
    });

    it('should still settle when the transform thenable rejects', async () => {
        const failingActivity = activity<string>('initial', async () => {
            throw new Error('import failed');
        });

        failingActivity.update('never-lands');
        await settled();

        expect(failingActivity.value()).to.equal('initial');
    });

    it('should await chained async work to quiescence', async () => {
        const settledWork: string[] = [];
        const nextMacrotask = () =>
            new Promise<void>((resolve) => setTimeout(resolve));
        const innerActivity = activity<string>(
            'inner-initial',
            async ({ input, update }) => {
                settledWork.push('inner-started');
                await nextMacrotask();
                settledWork.push('inner-settled');
                update(input);
            }
        );
        const outerActivity = activity<string>(
            'outer-initial',
            async ({ input, update }) => {
                await nextMacrotask();
                update(input);
                settledWork.push('outer-settled');
            }
        );

        // The chained work starts a macrotask after the outer work lands, so
        // the pending count is briefly zero in between — mirroring dynamic
        // `import()`, which settles beyond the microtask queue.
        outerActivity.watch(({ value }) => {
            value === 'outer-updated' &&
                setTimeout(() => innerActivity.update('inner-updated'));
        });

        outerActivity.update('outer-updated');
        await settled();

        expect(settledWork).to.deep.equal([
            'outer-settled',
            'inner-started',
            'inner-settled'
        ]);
        expect(innerActivity.value()).to.equal('inner-updated');
    });

    it('should scope pending work per window — an injected window cannot block the browser', async () => {
        const injectedWindow = {} as DomWindow;
        const pendingActivity = activity<string>('initial', async () => {
            // Never settles — the injected window's count stays pinned above zero.
            await new Promise<void>(() => {});
        });

        withWindow(injectedWindow, () => {
            pendingActivity.update('never-lands');
        });

        // Resolving at all proves isolation — a shared counter would hang
        // this await past the test timeout.
        await settled();
    });
});
