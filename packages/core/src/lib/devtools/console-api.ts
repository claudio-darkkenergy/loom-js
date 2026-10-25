import type {
    ComponentContextPartial,
    TemplateRoot,
    TemplateRootArray
} from '../../types';
import { InspectableActivity, describeActivity } from './activity-ref';
import { displayNameOf } from './names';
import { selectInDevtools } from './switch';
import {
    InspectableKind,
    activitiesOf,
    childContextsOf,
    findOwnerContext,
    getAppRoots,
    kindOf
} from './tree';

/** An activity as the `loom` console API reports it. */
export interface ActivityRecord {
    activity: InspectableActivity;
    name: string;
    pending: boolean;
    value: unknown;
}

/** A component instance or activity boundary as the console API reports it. */
export interface InspectRecord {
    activities: ActivityRecord[];
    children: InspectRecord[];
    key?: number | string;
    kind: InspectableKind;
    name: string;
    node?: TemplateRoot | TemplateRootArray;
    parent?: string;
    props?: object;
}

// The records the console API built — what devtools' console formatters
// recognize.
const inspectRecords = new WeakSet<object>();

/**
 * Whether a value is a record the `loom` console API produced.
 * @param value Any value.
 */
export const isInspectRecord = (value: unknown): value is InspectRecord =>
    typeof value === 'object' && value !== null && inspectRecords.has(value);

const toActivityRecord = (activity: InspectableActivity): ActivityRecord => ({
    activity,
    ...describeActivity(activity)
});

/**
 * The display name of a component instance or activity boundary.
 * @param ctx The inspectable context.
 */
export const nodeNameOf = (ctx: ComponentContextPartial) =>
    ctx.activity ? describeActivity(ctx.activity).name : displayNameOf(ctx);

const parentNameOf = (ctx: ComponentContextPartial) => {
    let parent = ctx.parent;

    while (parent && !kindOf(parent)) {
        parent = parent.parent;
    }

    return parent && nodeNameOf(parent);
};

/**
 * The console-API record of one component instance or activity boundary,
 * with its subtree.
 * @param ctx The inspectable context.
 */
export const inspectContext = (ctx: ComponentContextPartial): InspectRecord => {
    const kind = kindOf(ctx)!;
    const record: InspectRecord = {
        activities: activitiesOf(ctx).map(toActivityRecord),
        children: childContextsOf(ctx).map(inspectContext),
        kind,
        name: nodeNameOf(ctx),
        node: ctx.root
    };

    ctx.key !== undefined && (record.key = ctx.key);
    kind === 'component' && (record.props = ctx.props);
    inspectRecords.add(record);

    return record;
};

/** `loom.tree()` — every mounted app's component tree. */
export const inspectTree = () =>
    getAppRoots()
        .filter((ctx) => kindOf(ctx))
        .map(inspectContext);

/**
 * `loom.inspect(node)` — the component instance that rendered `node` (pair
 * with DevTools' `$0`); selects it in a running devtools HUD.
 * @param node Any DOM node inside a mounted app.
 * @returns The owning instance's record, or `undefined` outside every app.
 */
export const inspectNode = (node: Node) => {
    const ctx = findOwnerContext(node);

    if (!ctx) {
        return undefined;
    }

    const record = inspectContext(ctx);

    record.parent = parentNameOf(ctx);
    selectInDevtools(ctx);

    return record;
};

/** `loom.activities()` — the activities driving every mounted app. */
export const inspectActivities = () => {
    const found = new Set<InspectableActivity>();
    const visit = (ctx: ComponentContextPartial) => {
        activitiesOf(ctx).forEach((activity) => found.add(activity));
        childContextsOf(ctx).forEach(visit);
    };

    getAppRoots().forEach(visit);

    return Array.from(found, toActivityRecord);
};
