import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { activity, settled } from '../../src';
import { setDebug } from '../../src/config';

// A promise with its settle handles inverted out — the fixture that forces
// out-of-order resolution across concurrent dispatches.
const deferred = <T = void>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
    });

    return { promise, reject, resolve };
};

const nextMacrotask = () => new Promise((resolve) => setTimeout(resolve));

// Simulates signal-wired async work (the `fetch(url, { signal })` shape) —
// rejects with an abort error as soon as the signal fires.
const abortableWork = (gate: Promise<void>, signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
        signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
        );
        gate.then(resolve);
    });

describe('activity transform concurrency', () => {
    describe('latest-dispatch-wins (default)', () => {
        it('drops a superseded run’s stale commit when it resolves out of order', async () => {
            const firstGate = deferred();
            const secondGate = deferred();
            const testActivity = activity<string>(
                'initial',
                async ({ input, update }) => {
                    const gate = input === 'A' ? firstGate : secondGate;

                    await gate.promise;
                    update(input);
                }
            );

            testActivity.update('A');
            testActivity.update('B');

            // The newer dispatch resolves first...
            secondGate.resolve();
            await nextMacrotask();
            expect(testActivity.value()).to.equal('B');

            // ...then the stale one lands late — its commit must be dropped.
            firstGate.resolve();
            await settled();
            expect(testActivity.value()).to.equal('B');
        });

        it('applies multi-commit transforms in order within the current run', async () => {
            const gate = deferred();
            const testActivity = activity<string>(
                'idle',
                async ({ input, update }) => {
                    update('loading');
                    await gate.promise;
                    update(input);
                }
            );
            const committed: string[] = [];

            testActivity.watch(({ value }) => committed.push(value));
            testActivity.update('data');
            expect(testActivity.value()).to.equal('loading');

            gate.resolve();
            await settled();
            expect(committed).to.deep.equal(['idle', 'loading', 'data']);
        });

        it('keeps settlement waiting on a superseded run until it settles', async () => {
            const firstGate = deferred();
            const secondGate = deferred();
            const testActivity = activity<string>(
                'initial',
                async ({ input, update }) => {
                    const gate = input === 'A' ? firstGate : secondGate;

                    await gate.promise;
                    update(input);
                }
            );
            let settledResolved = false;

            testActivity.update('A');
            testActivity.update('B');
            secondGate.resolve();

            const settledPromise = settled().then(() => {
                settledResolved = true;
            });

            // Give an eager implementation ample macrotasks to resolve early.
            await new Promise((resolve) => setTimeout(resolve, 20));
            expect(settledResolved).to.be.false;

            firstGate.resolve();
            await settledPromise;
            expect(testActivity.value()).to.equal('B');
        });
    });

    describe('supersession signal', () => {
        it('aborts the superseded run’s signal so wired work settles fast', async () => {
            const firstGate = deferred();
            const secondGate = deferred();
            const seenSignals: AbortSignal[] = [];
            const testActivity = activity<string>(
                'initial',
                async ({ input, update, signal }) => {
                    const gate = input === 'A' ? firstGate : secondGate;

                    seenSignals.push(signal);

                    try {
                        await abortableWork(gate.promise, signal);
                    } catch (_abortError) {
                        return;
                    }

                    update(input);
                }
            );

            testActivity.update('A');
            testActivity.update('B');

            expect(seenSignals[0]?.aborted).to.be.true;
            expect(seenSignals[1]?.aborted).to.be.false;

            secondGate.resolve();
            // The first gate never resolves — the aborted run must not hold
            // settlement open.
            await settled();
            expect(testActivity.value()).to.equal('B');
        });

        it('stays safe when a superseded run ignores its signal', async () => {
            const firstGate = deferred();
            const secondGate = deferred();
            const testActivity = activity<string>(
                'initial',
                async ({ input, update }) => {
                    const gate = input === 'A' ? firstGate : secondGate;

                    // No signal wiring at all — the run completes obliviously.
                    await gate.promise;
                    update(input);
                }
            );

            testActivity.update('A');
            testActivity.update('B');
            secondGate.resolve();
            await nextMacrotask();
            firstGate.resolve();
            await settled();

            expect(testActivity.value()).to.equal('B');
        });

        it('never fires the signal in the ordered modes', async () => {
            for (const concurrency of ['ordered', 'serial'] as const) {
                const gates = [deferred(), deferred()];
                const seenSignals: AbortSignal[] = [];
                const testActivity = activity<number, number>(
                    0,
                    async ({ input, update, signal }) => {
                        seenSignals.push(signal);
                        await gates[input - 1]!.promise;
                        update(input);
                    },
                    { concurrency }
                );

                testActivity.update(1);
                testActivity.update(2);
                gates[1]!.resolve();
                gates[0]!.resolve();
                await settled();

                expect(
                    seenSignals.some((signal) => signal.aborted),
                    `no abort under '${concurrency}'`
                ).to.be.false;
            }
        });
    });

    describe("concurrency: 'ordered'", () => {
        it('starts dispatches in parallel and flushes commits in dispatch order', async () => {
            const gates = [deferred(), deferred(), deferred()];
            const starts: number[] = [];
            const testActivity = activity<number, number>(
                0,
                async ({ input, update }) => {
                    starts.push(input);
                    await gates[input - 1]!.promise;
                    update(input);
                },
                { concurrency: 'ordered' }
            );
            const committed: number[] = [];

            testActivity.watch(({ value }) => committed.push(value));
            testActivity.update(1);
            testActivity.update(2);
            testActivity.update(3);

            // All three transforms ran immediately — no queue latency.
            expect(starts).to.deep.equal([1, 2, 3]);

            // Later dispatches resolve first; their commits must hold.
            gates[2]!.resolve();
            gates[1]!.resolve();
            await nextMacrotask();
            expect(committed).to.deep.equal([0]);

            // The head settles — everything flushes in dispatch order.
            gates[0]!.resolve();
            await settled();
            expect(committed).to.deep.equal([0, 1, 2, 3]);
        });

        it('releases the turn when a run rejects, flushing later buffered commits', async () => {
            const firstGate = deferred();
            const secondGate = deferred();
            const testActivity = activity<number, number>(
                0,
                async ({ input, update }) => {
                    await (input === 1 ? firstGate : secondGate).promise;
                    update(input);
                },
                { concurrency: 'ordered' }
            );
            const committed: number[] = [];

            testActivity.watch(({ value }) => committed.push(value));
            testActivity.update(1);
            testActivity.update(2);

            secondGate.resolve();
            await nextMacrotask();
            expect(committed).to.deep.equal([0]);

            firstGate.reject(new Error('run 1 failed'));
            await settled();
            expect(committed).to.deep.equal([0, 2]);
        });
    });

    describe("concurrency: 'serial'", () => {
        it('does not start a dispatch until the prior run settles', async () => {
            const firstGate = deferred();
            const starts: string[] = [];
            const testActivity = activity<string>(
                'initial',
                async ({ input, update }) => {
                    starts.push(input);

                    if (input === 'A') {
                        await firstGate.promise;
                    }

                    update(input);
                },
                { concurrency: 'serial' }
            );

            testActivity.update('A');
            testActivity.update('B');
            await nextMacrotask();

            // B would settle instantly, but must wait its turn.
            expect(starts).to.deep.equal(['A']);

            firstGate.resolve();
            await settled();
            expect(starts).to.deep.equal(['A', 'B']);
            expect(testActivity.value()).to.equal('B');
        });

        it('hands each run its predecessor’s committed value', async () => {
            const seenValues: number[] = [];
            const testActivity = activity<number, number>(
                0,
                async ({ input, update, value }) => {
                    seenValues.push(value);
                    await Promise.resolve();
                    update(value + input);
                },
                { concurrency: 'serial' }
            );

            testActivity.update(1);
            testActivity.update(2);
            await settled();

            expect(seenValues).to.deep.equal([0, 1]);
            expect(testActivity.value()).to.equal(3);
        });

        it('releases the queue when a run rejects', async () => {
            const testActivity = activity<string>(
                'initial',
                async ({ input, update }) => {
                    if (input === 'A') {
                        throw new Error('run A failed');
                    }

                    update(input);
                },
                { concurrency: 'serial' }
            );

            testActivity.update('A');
            testActivity.update('B');
            await settled();

            expect(testActivity.value()).to.equal('B');
        });
    });

    describe('timeout', () => {
        let warnStub: sinon.SinonStub;

        beforeEach(() => {
            warnStub = sinon.stub(globalThis.console, 'warn');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('retires a hung serial run — queue and settlement both release', async () => {
            const hungGate = deferred();
            const testActivity = activity<string>(
                'initial',
                async ({ input, update }) => {
                    if (input === 'A') {
                        await hungGate.promise;
                    }

                    update(input);
                },
                { concurrency: 'serial', timeout: 30 }
            );

            testActivity.update('A');
            testActivity.update('B');
            // The hung run must not pin settlement or the queue.
            await settled();

            expect(testActivity.value()).to.equal('B');
            // Expiry warns on the always-on lane (debug is off here).
            expect(warnStub.called).to.be.true;

            // The retired run's late commit is dropped.
            hungGate.resolve();
            await nextMacrotask();
            expect(testActivity.value()).to.equal('B');
        });

        it('aborts the signal on expiry so wired work cancels', async () => {
            const hungGate = deferred();
            const seenSignals: AbortSignal[] = [];
            const testActivity = activity<string>(
                'initial',
                async ({ input, update, signal }) => {
                    seenSignals.push(signal);

                    try {
                        await abortableWork(hungGate.promise, signal);
                    } catch (_abortError) {
                        return;
                    }

                    update(input);
                },
                { timeout: 20 }
            );

            testActivity.update('A');
            await settled();

            expect(seenSignals[0]?.aborted).to.be.true;
            expect(testActivity.value()).to.equal('initial');
        });

        it('leaves runs unbounded when no timeout is set', async () => {
            const testActivity = activity<string>(
                'initial',
                async ({ input, update }) => {
                    await new Promise((resolve) => setTimeout(resolve, 40));
                    update(input);
                }
            );

            testActivity.update('A');
            await settled();

            expect(testActivity.value()).to.equal('A');
            expect(warnStub.called).to.be.false;
        });

        it('flags a long-pending run on the debug lane instead of inventing a bound', async () => {
            const infoStub = sinon.stub(globalThis.console, 'info');
            const holdGate = deferred();

            setDebug(true, { activity: true });

            const clock = sinon.useFakeTimers();
            const testActivity = activity<string>(
                'initial',
                async ({ input, update }) => {
                    await holdGate.promise;
                    update(input);
                }
            );

            try {
                testActivity.update('A');
                clock.tick(10000);

                expect(infoStub.called).to.be.true;
            } finally {
                clock.restore();
                setDebug(false);
            }

            // No timeout was applied — the run still commits when it lands.
            holdGate.resolve();
            await settled();
            expect(testActivity.value()).to.equal('A');
        });
    });

    describe('sync & untransformed paths', () => {
        it('keeps last-call-wins for untransformed activities', () => {
            const testActivity = activity(0);

            testActivity.update(1);
            testActivity.update(2);

            expect(testActivity.value()).to.equal(2);
        });

        it('keeps call-order commits for synchronous transforms', () => {
            const committed: number[] = [];
            const testActivity = activity<number, number>(
                0,
                ({ input, update }) => {
                    update(input * 2);
                }
            );

            testActivity.watch(({ value }) => committed.push(value));
            testActivity.update(1);
            testActivity.update(2);

            expect(testActivity.value()).to.equal(4);
            expect(committed).to.deep.equal([0, 2, 4]);
        });
    });
});
