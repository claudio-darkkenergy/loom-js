// Settlement tracking — the pending-work counter behind `settled()`. Every
// framework-mediated async operation (lazy imports, page-route imports, async
// data transforms) funnels through `activity.update()`'s transform call, so a
// thenable transform return is exactly the pending work the counter follows.
// State is keyed per window through the DOM provider seam so concurrent
// server renders (each with its own injected window) can't cross-talk.
import { DomWindow, getWindow, hasWindow } from './dom';
import type { DiagnosticSubjectRef } from './globals/diagnostic-format';

interface SettlementState {
    pending: number;
    // Refcounted so a subject with several in-flight runs stays listed until
    // its last run settles. Recorded always-on (not debug-gated): the
    // always-on `maxWait` warnings enumerate it — kept cheap as one map
    // upsert per tracked thenable, against a ref the caller already holds.
    pendingSubjects: Map<DiagnosticSubjectRef, number>;
    zeroWaiters: (() => void)[];
}

const settlementStates = new WeakMap<DomWindow, SettlementState>();

const getState = (win: DomWindow): SettlementState => {
    let state = settlementStates.get(win);

    if (!state) {
        state = { pending: 0, pendingSubjects: new Map(), zeroWaiters: [] };
        settlementStates.set(win, state);
    }

    return state;
};

/**
 * Tracks a transform's return value against the current window's pending
 * count. Non-thenable returns (the synchronous path) exit on a bare `typeof`
 * check — no allocation. A thenable increments while in flight and decrements
 * when it settles, resolve or reject — a failed import still ends the wait.
 * The window is captured at track time so the decrement lands on the same
 * counter even if the resolvable window has changed by then.
 */
export const trackTransformResult = (
    result: unknown,
    subject?: DiagnosticSubjectRef
): void => {
    if (
        result === null ||
        (typeof result !== 'object' && typeof result !== 'function') ||
        typeof (result as PromiseLike<unknown>).then !== 'function' ||
        !hasWindow()
    ) {
        return;
    }

    const state = getState(getWindow());
    const onSettled = () => {
        state.pending--;

        if (subject) {
            const remaining = (state.pendingSubjects.get(subject) ?? 1) - 1;

            remaining > 0
                ? state.pendingSubjects.set(subject, remaining)
                : state.pendingSubjects.delete(subject);
        }

        if (state.pending === 0) {
            state.zeroWaiters.splice(0).forEach((notify) => notify());
        }
    };

    state.pending++;
    subject &&
        state.pendingSubjects.set(
            subject,
            (state.pendingSubjects.get(subject) ?? 0) + 1
        );
    (result as PromiseLike<unknown>).then(onSettled, onSettled);
};

/**
 * The current window's pending count — diagnostic surface for bounded waits
 * (`hydrate`'s `maxWait` warning names it).
 */
export const getPendingCount = (): number =>
    hasWindow() ? (settlementStates.get(getWindow())?.pending ?? 0) : 0;

/**
 * The current window's still-pending diagnostic subjects — what the bounded
 * settlement warnings enumerate alongside the count.
 */
export const getPendingSubjects = (): DiagnosticSubjectRef[] =>
    hasWindow()
        ? Array.from(
              settlementStates.get(getWindow())?.pendingSubjects.keys() ?? []
          )
        : [];

/**
 * Waits out a settle gate up to `maxWait` ms; resolves `true` when the bound
 * expired before the gate settled, `false` when the gate won. `Infinity`
 * disables the bound. Shared by every bounded settlement consumer (`hydrate`,
 * `renderToString`) so the bound is one concept framework-wide.
 */
export const boundedWait = async (
    gate: Promise<unknown>,
    maxWait: number
): Promise<boolean> => {
    if (maxWait === Infinity) {
        await gate;

        return false;
    }

    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const expired = await Promise.race([
        gate.then(() => false),
        new Promise<boolean>((resolve) => {
            expiryTimer = setTimeout(() => resolve(true), maxWait);
        })
    ]);

    clearTimeout(expiryTimer);

    return expired;
};

/**
 * Notifies once the current window's pending count reaches zero and stays
 * zero through one further macrotask — chains re-arm the count (a resolved
 * import whose render starts another import), and dynamic `import()` settles
 * beyond the microtask queue, so a bare zero-crossing isn't quiescence.
 */
export const whenSettled = (notify: () => void): void => {
    const state = getState(getWindow());
    const awaitZero = () => {
        state.pending === 0
            ? confirmQuiet()
            : state.zeroWaiters.push(confirmQuiet);
    };
    const confirmQuiet = () => {
        setTimeout(() => {
            state.pending === 0 ? notify() : awaitZero();
        });
    };

    awaitZero();
};
