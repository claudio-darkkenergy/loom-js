import { canDebug } from '../../config';
import type { ComponentContext, TemplateNodeUpdate } from '../../types';
import { appendChildContext, getShareableContext } from '../context';
import { loomConsole } from '../globals/loom-console';
import { reactiveEffect } from '../reactive';

export const setReactiveUpdates = (
    update: TemplateNodeUpdate,
    i: number,
    ctx: ComponentContext
) =>
    reactiveEffect((values) => {
        const updateValue = values[i];
        const childCtx = appendChildContext(ctx, updateValue, i);
        const canDebugUpdates = canDebug('updates');

        // Fold the per-value detail into a collapsed group per update cycle —
        // consistent with the `loom (Updating...)` group in `html-parser.ts`.
        canDebugUpdates &&
            loomConsole.groupCollapsed(
                `loom (Updating${ctx.key ? ` \`${ctx.key}\`` : ''}...)`,
                getShareableContext(ctx)
            );
        canDebugUpdates && loomConsole.info('should update', { updateValue });

        // Call all the updates for the component for every render cycle.
        update(updateValue, childCtx);

        canDebugUpdates && loomConsole.groupEnd();
    }, ctx.values);
