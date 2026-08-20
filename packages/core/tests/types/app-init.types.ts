// Compile-time assertions for `init`'s placement contract
// (`core-api-follow-ups` design Decision 1) — covered by `type-check-tests`;
// never executed.
import { init } from '../../src';
import type { ContextFunction } from '../../src/types';

declare const app: ContextFunction;

export const assertPlacementContract = () => {
    // The placement union is the whole contract — omitted means `'replace'`.
    init({ app });
    init({ app, placement: 'replace' });
    init({ app, placement: 'append' });
    init({ app, placement: 'prepend' });

    // @ts-expect-error — the boolean `append` prop is gone.
    init({ app, append: true });

    // @ts-expect-error — only the three placement modes are accepted.
    init({ app, placement: 'after' });
};
