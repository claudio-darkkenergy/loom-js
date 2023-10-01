import { canDebug } from '../../config';
import type { ComponentContext, TemplateNodeUpdate } from '../../types';
import { appendChildContext } from '../context';
import { loomConsole } from '../globals/loom-console';
import { updateEffect } from '../reactive';

export const setReactiveUpdates = (
    update: TemplateNodeUpdate,
    i: number,
    ctx: ComponentContext
) =>
    updateEffect((values) => {
        const updateValue = values[i];
        const childCtx = appendChildContext(ctx, updateValue, i);

        canDebug('updates') &&
            loomConsole.info('should update', { updateValue });

        // Call all the updates for the component for every render cycle.
        update(updateValue, childCtx);
    }, ctx.values);
