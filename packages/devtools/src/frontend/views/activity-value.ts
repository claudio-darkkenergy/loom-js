// An activity's value, edited in place: click an editable value to edit,
// Enter or leaving the field applies, Escape cancels, and a rejected edit
// stays open with its error.
import { activity, component } from '@loom-js/core';

import type { Encoded } from '../../protocol/types';
import type { ActivityItemProps } from './activity-item';
import { ValueRow } from './value-view';

const INCOMPLETE = Symbol('incomplete');

// Rebuilds a JSON value from its encoding — `INCOMPLETE` when part of it was
// left to path expansion or isn't JSON.
const decodeJson = (value: Encoded): unknown => {
    switch (value.t) {
        case 'null':
            return null;
        case 'bool':
            return value.v;
        case 'num':
            return typeof value.v === 'number' ? value.v : INCOMPLETE;
        case 'str':
            return value.length ? INCOMPLETE : value.v;
        case 'array': {
            const items = value.items?.map(decodeJson);

            return items &&
                items.length === value.length &&
                !items.includes(INCOMPLETE)
                ? items
                : INCOMPLETE;
        }
        case 'object': {
            const entries = value.entries?.map(
                ([key, item]) => [key, decodeJson(item)] as const
            );

            return entries &&
                entries.length === value.size &&
                !entries.some(([, item]) => item === INCOMPLETE)
                ? Object.fromEntries(entries)
                : INCOMPLETE;
        }
        default:
            return INCOMPLETE;
    }
};

/** The value's JSON text for the edit field, or '' when it can't be shown. */
export const jsonTextOf = (value: Encoded) => {
    const decoded = decodeJson(value);

    return decoded === INCOMPLETE ? '' : JSON.stringify(decoded);
};

interface EditState {
    // The rejected text, kept so a failed edit can be corrected.
    draft?: string;
    error: string;
    open: boolean;
}

const CLOSED: EditState = { error: '', open: false };

export const ActivityValue = component<
    Pick<ActivityItemProps, 'actions' | 'record' | 'valueContext'>
>(
    (html, { actions, own, record, valueContext }) => {
        const { editable, id, value } = record;
        const edit = own(() => activity<EditState>(CLOSED));
        const text = jsonTextOf(value);
        const apply = async (next: string) => {
            if (next === text) {
                edit.update(CLOSED);
                return;
            }

            const error = await actions.editActivity(id, next);

            edit.update(error ? { draft: next, error, open: true } : CLOSED);
        };

        return html`
            <ul class="value-list">
                ${edit.effect(({ value: { draft, error, open } }) =>
                    open
                        ? ValueEditor({
                              activityId: id,
                              error,
                              onApply: apply,
                              onCancel: () => edit.update(CLOSED),
                              text: draft ?? text
                          })
                        : ValueRow({
                              context: valueContext,
                              label: 'value',
                              onEdit:
                                  editable && text
                                      ? () =>
                                            edit.update({
                                                error: '',
                                                open: true
                                            })
                                      : undefined,
                              path: [`a${id}`],
                              value
                          })
                )}
            </ul>
        `;
    },
    { name: 'ActivityValue' }
);

interface ValueEditorProps {
    activityId: number;
    error: string;
    onApply(text: string): void;
    onCancel(): void;
    text: string;
}

const ValueEditor = component<ValueEditorProps>(
    (html, { activityId, error, onApply, onCancel, onMounted, own, text }) => {
        // Enter and Escape remove the field; its blur must not apply again.
        // Kept across re-renders: a commit re-renders the open editor. A
        // rejected edit reopens it for another try.
        const outcome = own(() => ({ error: '', settled: false }));

        error !== outcome.error &&
            ((outcome.error = error), (outcome.settled = false));
        const settle = (action: () => void) => {
            outcome.settled || action();
            outcome.settled = true;
        };
        const onKeydown = (event: Event) => {
            const { key } = event as KeyboardEvent;
            const field = event.target as HTMLInputElement;

            key === 'Enter' &&
                (event.preventDefault(), settle(() => onApply(field.value)));
            key === 'Escape' && settle(onCancel);
        };

        onMounted((node) => {
            const field = (node as Element).querySelector('input');

            field?.focus();
            field?.select();
        });

        return html`
            <li class="value-row value-editor">
                <div class="value-line">
                    <span class="value-key">value</span>
                    <input
                        aria-invalid=${error ? 'true' : undefined}
                        aria-label=${`New value for activity ${activityId}`}
                        class="hud-input"
                        $blur=${(event: Event) => {
                            const field = event.target as HTMLInputElement;

                            // Removing a focused field blurs it; that's no edit.
                            field.isConnected &&
                                settle(() => onApply(field.value));
                        }}
                        $keydown=${onKeydown}
                        value=${text}
                    />
                </div>
                ${error ? EditError({ text: error }) : ''}
            </li>
        `;
    },
    { name: 'ValueEditor' }
);

const EditError = component<{ text: string }>(
    (html, { text }) => html`
        <p class="edit-error" role="alert">${text}</p>
    `,
    { name: 'EditError' }
);
