// Compile-time assertions for the transform context's read-only `input`
// contract (`activity-transform-concurrency` design D2c) — covered by
// `type-check-tests`; never executed.
import { activity } from '../../src';
import type { ActivityTransform } from '../../src/types';

interface PageInput {
    slug: string;
    tags: string[];
}

export const assertInputIsReadOnly = () => {
    const transform: ActivityTransform<string, PageInput> = ({
        input,
        update
    }) => {
        // Reading is the contract.
        update(input.slug);

        // @ts-expect-error — `input` properties are read-only.
        input.slug = 'mutated';
    };

    return activity<string, PageInput>('initial', transform);
};

// The context also carries the run's abort signal.
export const assertSignalOnContext: ActivityTransform<string, string> = ({
    input,
    signal,
    update
}) => {
    signal.aborted || update(input);
};
