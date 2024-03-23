import { activity } from '@loom-js/core';

export const GetStartedActivity = activity<'hide' | 'show', boolean>(
    'hide',
    ({ input, update }) => update(input ? 'show' : 'hide')
);
