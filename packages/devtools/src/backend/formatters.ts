// Custom console formatters (`window.devtoolsFormatters`, honored by
// Chromium and Firefox consoles once "custom formatters" is enabled): loom
// console-API records and activities log as their names, expandable to
// their parts. Consoles without the setting show plain objects.
import {
    type ActivityRecord,
    type InspectRecord,
    describeActivity,
    isInspectRecord,
    isInspectableActivity
} from '@loom-js/core/devtools';

type JsonML = [string, Record<string, unknown>, ...unknown[]];

interface Formatter {
    body(value: unknown): JsonML | null;
    hasBody(value: unknown): boolean;
    header(value: unknown): JsonML | null;
}

const NAME_STYLE = 'color:#6d28d9;font-weight:600';
const KEY_STYLE = 'color:#0e7490';
const MUTED_STYLE = 'color:#6b7280';

// A nested object reference the console renders with its own expander.
const objectRef = (object: unknown): JsonML => ['object', { object }];

const row = (label: string, value: unknown): JsonML => [
    'li',
    {},
    ['span', { style: KEY_STYLE }, `${label}: `],
    objectRef(value)
];

const recordHeader = ({ key, kind, name }: InspectRecord): JsonML => [
    'span',
    {},
    [
        'span',
        { style: NAME_STYLE },
        kind === 'effect' ? `${name} effect` : name
    ],
    ...(key !== undefined
        ? [['span', { style: KEY_STYLE }, ` key=${String(key)}`]]
        : [])
];

const activityHeader = (
    name: string,
    value: unknown,
    pending: boolean
): JsonML => [
    'span',
    {},
    ['span', { style: NAME_STYLE }, name],
    ['span', { style: MUTED_STYLE }, pending ? ' (pending) = ' : ' = '],
    objectRef(value)
];

const isActivityRecord = (value: unknown): value is ActivityRecord =>
    typeof value === 'object' &&
    value !== null &&
    isInspectableActivity((value as ActivityRecord).activity) &&
    'name' in value;

export const loomFormatter: Formatter = {
    body(value) {
        if (isInspectRecord(value)) {
            return [
                'ol',
                { style: 'list-style:none;margin:0;padding-left:12px' },
                ...(value.props ? [row('props', value.props)] : []),
                ...(value.activities.length
                    ? [row('activities', value.activities)]
                    : []),
                ...(value.parent ? [row('parent', value.parent)] : []),
                ...(value.children.length
                    ? [row('children', value.children)]
                    : []),
                row('node', value.node)
            ];
        }

        const activity = isActivityRecord(value) ? value.activity : value;

        return isInspectableActivity(activity)
            ? [
                  'ol',
                  { style: 'list-style:none;margin:0;padding-left:12px' },
                  row('value', activity.value()),
                  row('handle', { ...activity })
              ]
            : null;
    },
    hasBody: (value) =>
        isInspectRecord(value) ||
        isActivityRecord(value) ||
        isInspectableActivity(value),
    header(value) {
        if (isInspectRecord(value)) {
            return recordHeader(value);
        }

        if (isActivityRecord(value)) {
            return activityHeader(value.name, value.value, value.pending);
        }

        if (isInspectableActivity(value)) {
            const { name, pending, value: current } = describeActivity(value);

            return activityHeader(name, current, pending);
        }

        return null;
    }
};

type FormatterHost = { devtoolsFormatters?: Formatter[] };

/**
 * Registers the loom formatter on a window; returns the unregister.
 * @param view The page window.
 */
export const installFormatters = (view: Window) => {
    const host = view as unknown as FormatterHost;
    const formatters = (host.devtoolsFormatters ??= []);

    formatters.push(loomFormatter);

    return () => {
        const index = formatters.indexOf(loomFormatter);

        index >= 0 && formatters.splice(index, 1);
    };
};
