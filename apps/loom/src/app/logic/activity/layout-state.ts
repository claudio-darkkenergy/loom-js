import { activity } from '@loom-js/core';

export type LayoutStateValue = {
    sideNav: boolean;
};

export const layoutState = activity<
    LayoutStateValue,
    Partial<LayoutStateValue>
>({ sideNav: false }, ({ input, update, value }) =>
    // Merge the changed state with the current state.
    update({ ...value, ...input })
);
