import { canDebug } from '../../config';
import type {
    ComponentContext,
    SlotUpdater,
    TemplateNodeUpdate,
    TemplateTagValue
} from '../../types';
import { appendChildContext, getShareableContext } from '../context';
import {
    createDiagnosticSubject,
    formatDiagnostic
} from '../globals/diagnostic-format';
import { loomConsole } from '../globals/loom-console';

// Wraps one dynamic path's node update as the slot's updater: it resolves
// the slot's child context and applies the value. No subscription — the
// instance's render loop calls it when the slot's value changes.
export const slotUpdater =
    (
        update: TemplateNodeUpdate,
        index: number,
        ctx: ComponentContext
    ): SlotUpdater =>
    (updateValue: TemplateTagValue) => {
        const childCtx = appendChildContext(ctx, updateValue, index);
        const canDebugUpdates = canDebug('updates');

        // Fold the per-value detail into a collapsed group per update cycle —
        // consistent with the `loom (Updating...)` group in `html-parser.ts`.
        canDebugUpdates &&
            loomConsole.groupCollapsed(
                ...formatDiagnostic({
                    event: 'updating',
                    scope: 'updates',
                    subject: ctx.key
                        ? createDiagnosticSubject('component', String(ctx.key))
                        : undefined
                }),
                getShareableContext(ctx)
            );
        canDebugUpdates && loomConsole.info('should update', { updateValue });

        update(updateValue, childCtx);

        canDebugUpdates && loomConsole.groupEnd();
    };
