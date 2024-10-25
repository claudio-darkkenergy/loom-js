import { activity } from '@loom-js/core';

export const sideNavToggle = activity<boolean, boolean | null>(
    false,
    ({ input, update, value }) => update(input ?? !value)
);
