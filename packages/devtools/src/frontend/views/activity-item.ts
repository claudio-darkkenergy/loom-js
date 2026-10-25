import { component } from '@loom-js/core';

import type { ActivityRecord, Encoded } from '../../protocol/types';
import type { HudState } from '../state';
import { ValueRow, type ValueContext } from './value-view';

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

export interface ActivityItemProps {
    actions: HudState['actions'];
    record: ActivityRecord;
    valueContext: ValueContext;
}

export const ActivityItem = component<ActivityItemProps>(
    (html, { actions, record, valueContext }) => {
        const { editable, id, name, pending, subscriberIds, value } = record;
        const submit = (event: Event) => {
            event.preventDefault();

            const field = (event.target as HTMLFormElement).elements.namedItem(
                'value'
            ) as HTMLInputElement;

            actions.editActivity(id, field.value);
        };

        return html`
            <li class="activity-item">
                <div class="activity-head">
                    <span class="activity-name">${name}</span>
                    ${pending ? '⏳ pending' : ''}
                    <span class="hud-muted">
                        ${
                            subscriberIds.length
                                ? `${subscriberIds.length} user${subscriberIds.length === 1 ? '' : 's'}`
                                : 'no rendered users'
                        }
                    </span>
                    <span class="hud-spacer"></span>
                    <button
                        class="hud-button"
                        $click=${() => actions.log(id)}
                        type="button"
                    >
                        Log
                    </button>
                    <button
                        class="hud-button"
                        $click=${() => actions.resetActivity(id)}
                        type="button"
                    >
                        Reset
                    </button>
                </div>
                <ul class="value-list">
                    ${ValueRow({
                        context: valueContext,
                        label: 'value',
                        path: [`a${id}`],
                        value
                    })}
                </ul>
                ${editable ? ActivityEditor({ activityId: id, onSubmit: submit, text: jsonTextOf(value) }) : ''}
            </li>
        `;
    },
    { name: 'ActivityItem' }
);

interface ActivityEditorProps {
    activityId: number;
    onSubmit(event: Event): void;
    text: string;
}

const ActivityEditor = component<ActivityEditorProps>(
    (html, { activityId, onSubmit, text }) => html`
        <form class="activity-editor" $submit=${onSubmit}>
            <input
                aria-label=${`New value for activity ${activityId}`}
                class="hud-input"
                name="value"
                placeholder="JSON value"
                value=${text}
            />
            <button class="hud-button is-primary" type="submit">Set</button>
        </form>
    `,
    { name: 'ActivityEditor' }
);
