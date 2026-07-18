import { activity, ActivityTransform } from '@loom-js/core';

const toggleTransform: ActivityTransform<boolean, boolean | null> = ({
    input,
    update,
    value
}) => update(input ?? !value);

export const sideNavToggle = activity<boolean, boolean | null>(
    false,
    toggleTransform
);

export const topicTocToggle = activity<boolean, boolean | null>(
    false,
    toggleTransform
);
