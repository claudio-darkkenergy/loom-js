import { canDebug } from '../../config';
import type { ComponentContextPartial, OwnedValueStore } from '../../types';
import {
    createDiagnosticSubject,
    formatDiagnostic
} from '../globals/diagnostic-format';
import { loomConsole } from '../globals/loom-console';

const OWN_REMEDY =
    'call `own` unconditionally, in the same order, every render';

const warnMismatch = (ctx: ComponentContextPartial, detail: string) => {
    canDebug('updates') &&
        loomConsole.warn(
            ...formatDiagnostic({
                detail,
                event: 'call-order mismatch',
                remedy: OWN_REMEDY,
                scope: 'own',
                subject: ctx.key
                    ? createDiagnosticSubject('component', String(ctx.key))
                    : undefined
            })
        );
};

/**
 * Creates the per-render `own` cursor over a component context's owned-value
 * store — the `createRef` memoization pattern generalized to arbitrary
 * values. The first render pushes each factory's result in call order; every
 * re-render replays the cached values in that same order.
 * @param ctx The cached/scoped template context holding the store.
 * @returns The `own` prop for this render, plus `settle` — called after the
 *      render function returns, it warns when the render underran the cached
 *      call order and seals the store after its creating render.
 */
export const memoizedOwnedValues = (ctx: ComponentContextPartial) => {
    let callCount = 0;

    return {
        own<T>(create: () => T): T {
            const store: OwnedValueStore =
                ctx.owned ?? (ctx.owned = { sealed: false, values: [] });
            const index = callCount++;

            if (index < store.values.length) {
                return store.values[index] as T;
            }

            // A sealed store means the first render is over — this call has
            // no cached slot, so the value can never survive a re-render.
            if (store.sealed) {
                warnMismatch(
                    ctx,
                    `re-render call ${index + 1} overran the ${
                        store.values.length
                    } cached on first render; its value cannot survive re-renders`
                );

                return create();
            }

            const value = create();

            store.values.push(value);

            return value;
        },
        settle() {
            const store = ctx.owned;

            if (!store) {
                return;
            }

            if (store.sealed && callCount < store.values.length) {
                warnMismatch(
                    ctx,
                    `re-render made ${callCount} of the ${store.values.length} calls cached on first render`
                );
            }

            store.sealed = true;
        }
    };
};
