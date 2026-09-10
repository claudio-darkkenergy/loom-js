import { canDebug } from '../../config';
import type { ActivityConcurrency } from '../../types';
import { loomConsole } from '../globals/loom-console';
import { trackTransformResult } from '../settlement';

// Debug-lane threshold for flagging a still-pending transform run on an
// activity that set no `timeout` — a pointer at the missing bound, never an
// invented one.
const LONG_PENDING_NOTICE_MS = 5000;

const isThenable = (candidate: unknown): candidate is PromiseLike<unknown> =>
    candidate !== null &&
    (typeof candidate === 'object' || typeof candidate === 'function') &&
    typeof (candidate as PromiseLike<unknown>).then === 'function';

// One record per `update()` of a transform-bearing activity. A run is
// retired (superseded under `'latest'`, or timed out) when its later
// commits must be dropped; retirement aborts its signal but leaves it
// settlement-tracked until it actually settles — or, on timeout, counts
// it settled by the clock.
interface TransformRun<V> {
    // Ordered-mode holding pen while the run isn't the committing head.
    buffer: V[] | null;
    controller: AbortController;
    resolveTracked: (() => void) | null;
    retired: boolean;
    settled: boolean;
}

// A single transform invocation, handed the run's gated commit path and its
// abort signal — the dispatcher owns everything else about the run.
export type TransformRunInvoke<V> = (
    runUpdate: (valueInput: V) => void,
    signal: AbortSignal
) => unknown;

export interface TransformDispatcherOptions<V> {
    // The store's raw commit — the only way a run's value lands.
    commit: (valueInput: V) => void;
    concurrency: ActivityConcurrency;
    timeout?: number;
}

/**
 * The dispatch semantics for an activity's transform runs — latest-wins
 * supersession (default), the `'ordered'` commit buffer, the `'serial'`
 * queue, `timeout` retirement, and settlement tracking. One concern: how
 * overlapping dispatches relate to each other and to the stored value.
 * @returns The dispatch function — one call per `update()`/`reset()`.
 */
export const createTransformDispatcher = <V>({
    commit,
    concurrency,
    timeout
}: TransformDispatcherOptions<V>) => {
    let latestRun: TransformRun<V> | null = null;
    const orderedRuns: TransformRun<V>[] = [];
    const serialQueue: (() => void)[] = [];
    let serialActive = false;

    const retireRun = (run: TransformRun<V>) => {
        run.retired = true;
        run.buffer && (run.buffer.length = 0);
        run.controller.abort();
    };
    const makeRunUpdate = (run: TransformRun<V>) => (valueInput: V) => {
        if (run.retired) {
            canDebug('activity') &&
                loomConsole.info(
                    '[loom] activity: dropped a commit from a retired transform run (superseded or timed out).'
                );

            return;
        }

        // A non-head ordered run holds its commits until every earlier
        // dispatch has settled and flushed.
        if (concurrency === 'ordered' && orderedRuns[0] !== run) {
            run.buffer?.push(valueInput);

            return;
        }

        commit(valueInput);
    };
    const settleRun = (run: TransformRun<V>) => {
        if (run.settled) {
            return;
        }

        run.settled = true;
        run.resolveTracked?.();

        if (concurrency === 'ordered') {
            // Flush forward: drop settled heads, handing each successor its
            // buffered commits as it becomes the live committing head.
            while (orderedRuns[0]?.settled) {
                orderedRuns.shift();

                const head = orderedRuns[0];

                head?.buffer
                    ?.splice(0)
                    .forEach(
                        (bufferedValue) =>
                            !head.retired && commit(bufferedValue)
                    );
            }
        } else if (concurrency === 'serial') {
            const startNext = serialQueue.shift();

            startNext ? startNext() : (serialActive = false);
        }
    };
    const runTransform = (
        run: TransformRun<V>,
        invoke: TransformRunInvoke<V>
    ) => {
        const result = invoke(makeRunUpdate(run), run.controller.signal);

        // The synchronous path — already settled, nothing to bound or track.
        if (!isThenable(result)) {
            settleRun(run);

            return;
        }

        // `'serial'` runs were tracked at enqueue time (queue wait is
        // pending work too); the other modes track from invocation.
        run.resolveTracked ||
            trackTransformResult(
                new Promise<void>((resolve) => {
                    run.resolveTracked = resolve;
                })
            );

        let pendingTimer: ReturnType<typeof setTimeout> | undefined;
        const onResultSettled = () => {
            clearTimeout(pendingTimer);
            settleRun(run);
        };

        result.then(onResultSettled, onResultSettled);

        if (timeout !== undefined) {
            // Retire by the clock: the run counts as settled for the
            // settlement signal even if its promise never resolves, so a
            // hung transform can't block a queue or pin `settled()`.
            pendingTimer = setTimeout(() => {
                if (run.settled) {
                    return;
                }

                retireRun(run);
                loomConsole.warn(
                    `[loom] activity: a transform run exceeded its ${timeout}ms timeout and was retired — its signal aborted and any later commits are dropped.`
                );
                settleRun(run);
            }, timeout);
        } else if (canDebug('activity')) {
            pendingTimer = setTimeout(() => {
                !run.settled &&
                    canDebug('activity') &&
                    loomConsole.info(
                        `[loom] activity: a transform run has been pending for ${LONG_PENDING_NOTICE_MS}ms and the activity sets no \`timeout\` — it stays unbounded.`
                    );
            }, LONG_PENDING_NOTICE_MS);
        }
    };

    return (invoke: TransformRunInvoke<V>) => {
        const run: TransformRun<V> = {
            buffer: concurrency === 'ordered' ? [] : null,
            controller: new AbortController(),
            resolveTracked: null,
            retired: false,
            settled: false
        };

        if (concurrency === 'serial') {
            // Settlement counts a queued dispatch from enqueue time, so
            // `settled()` drains the whole queue.
            trackTransformResult(
                new Promise<void>((resolve) => {
                    run.resolveTracked = resolve;
                })
            );

            const start = () => runTransform(run, invoke);

            if (serialActive) {
                serialQueue.push(start);
            } else {
                serialActive = true;
                start();
            }

            return;
        }

        if (concurrency === 'ordered') {
            orderedRuns.push(run);
        } else {
            // `'latest'` — the new dispatch supersedes the in-flight run:
            // its later commits drop and its signal aborts, while its
            // promise stays settlement-tracked.
            latestRun && !latestRun.settled && retireRun(latestRun);
            latestRun = run;
        }

        runTransform(run, invoke);
    };
};
