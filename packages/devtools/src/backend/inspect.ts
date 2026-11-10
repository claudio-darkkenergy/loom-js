// Reads the live app through core's introspection surface and describes it
// in protocol terms: tree nodes, node details, activity records, encoded
// values.
import {
    type ComponentContextPartial,
    type InspectableActivity,
    activitiesOf,
    childContextsOf,
    describeActivity,
    displayNameOf,
    instanceOf,
    findOwnerContext,
    getAppRoots,
    inspectContext,
    isInspectableActivity,
    kindOf,
    nodeNameOf
} from '@loom-js/core/devtools';

import { type DescribeSpecial, encodeValue } from '../protocol/encode';
import type {
    ActivityRecord,
    Encoded,
    NodeDetails,
    TreeNode
} from '../protocol/types';
import type { IdRegistry } from './ids';

type ContextFunctionValue = {
    (ctx?: ComponentContextPartial, dryRun?: boolean): ComponentContextPartial;
    contextFunctionKind?: 'activity' | 'component';
};

/**
 * Whether a value survives a JSON round trip unchanged — what activity
 * editing accepts and offers.
 * @param value Any value.
 */
export const isJsonValue = (value: unknown): boolean => {
    if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'boolean'
    ) {
        return true;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) && !Object.is(value, -0);
    }

    if (Array.isArray(value)) {
        return value.every(isJsonValue);
    }

    if (typeof value === 'object') {
        const prototype = Object.getPrototypeOf(value);

        return (
            (prototype === Object.prototype || prototype === null) &&
            Object.values(value).every(isJsonValue)
        );
    }

    return false;
};

export const createInspector = (ids: IdRegistry) => {
    // Activities reported at creation — reachable even when no rendered
    // tree holds them.
    const createdActivities = new Set<WeakRef<InspectableActivity>>();
    // `owner`: the instance whose props or owned values are being encoded,
    // under which a component value is looked up.
    const describeSpecialFor =
        (owner?: ComponentContextPartial): DescribeSpecial =>
        (value) => {
            if (isInspectableActivity(value)) {
                return {
                    id: ids.idOf(value),
                    name: describeActivity(value).name,
                    t: 'activity'
                };
            }

            if (typeof Node !== 'undefined' && value instanceof Node) {
                const nodeOwner = findOwnerContext(value);
                const ownsRoot =
                    nodeOwner &&
                    (Array.isArray(nodeOwner.root)
                        ? nodeOwner.root[0] === value
                        : nodeOwner.root === value);

                return {
                    id: ownsRoot ? ids.idOf(nodeOwner) : undefined,
                    t: 'node',
                    tag: value.nodeName.toLowerCase()
                };
            }

            const kind =
                typeof value === 'function' &&
                (value as ContextFunctionValue).contextFunctionKind;

            if (kind === 'component') {
                const instance = owner && instanceOf(value, owner);

                // A dry run returns a throwaway snapshot — it never renders.
                return {
                    id: instance && ids.idOf(instance),
                    name: displayNameOf(
                        (value as ContextFunctionValue)({}, true)
                    ),
                    t: 'component'
                };
            }

            return kind === 'activity'
                ? { name: 'activity effect', t: 'fn' }
                : undefined;
        };
    const encode = (value: unknown, owner?: ComponentContextPartial): Encoded =>
        encodeValue(value, describeSpecialFor(owner));

    const walk = (visit: (ctx: ComponentContextPartial) => void) => {
        const step = (ctx: ComponentContextPartial) => {
            visit(ctx);
            childContextsOf(ctx).forEach(step);
        };

        getAppRoots()
            .filter((ctx) => kindOf(ctx))
            .forEach(step);
    };

    // Each instance-owned activity's owner, from the live tree's `own()`
    // values.
    const ownersOf = () => {
        const owners = new Map<InspectableActivity, ComponentContextPartial>();

        walk((ctx) =>
            ctx.owned?.values.forEach(
                (value) =>
                    isInspectableActivity(value) &&
                    !owners.has(value) &&
                    owners.set(value, ctx)
            )
        );

        return owners;
    };

    // The ids of the component instances using each activity the tree
    // holds. Parents are visited first, so a boundary under no component
    // (the app root, say) is the only kind listed with no users.
    const usersOf = () => {
        const subscribers = new Map<InspectableActivity, number[]>();
        const subscriberIdsOf = (activity: InspectableActivity) =>
            subscribers.get(activity) ??
            subscribers.set(activity, []).get(activity)!;

        walk((ctx) =>
            kindOf(ctx) === 'component'
                ? activitiesOf(ctx).forEach((activity) =>
                      subscriberIdsOf(activity).push(ids.idOf(ctx))
                  )
                : subscriberIdsOf(ctx.activity!)
        );

        return subscribers;
    };

    const activityRecord = (
        activity: InspectableActivity,
        subscriberIds: number[] = [],
        owner?: ComponentContextPartial
    ): ActivityRecord => {
        const { labeled, name, pending, value } = describeActivity(activity);
        const ownerName = owner && nodeNameOf(owner);

        return {
            editable: isJsonValue(value),
            id: ids.idOf(activity),
            // An unlabeled owned activity reads as its owner's.
            name: ownerName && !labeled ? `${ownerName} › ${name}` : name,
            owner: owner && { id: ids.idOf(owner), name: ownerName! },
            pending,
            subscriberIds,
            value: encode(value)
        };
    };

    return {
        activityRecord,
        encode,
        noteCreated(activity: InspectableActivity) {
            createdActivities.add(new WeakRef(activity));
        },
        // What the log action prints for an activity: a plain snapshot that
        // reads without custom formatters, with the live handle attached.
        logRecord(activity: InspectableActivity) {
            const owner = ownersOf().get(activity);
            const { name } = activityRecord(activity, [], owner);
            const { pending, value } = describeActivity(activity);
            const subscribers: ComponentContextPartial[] = [];

            walk(
                (ctx) =>
                    kindOf(ctx) === 'component' &&
                    activitiesOf(ctx).includes(activity) &&
                    subscribers.push(ctx)
            );

            return {
                activity,
                name,
                pending,
                scope: owner ? inspectContext(owner) : null,
                subscribers: subscribers.map(inspectContext),
                value
            };
        },
        // Every activity the tree uses, holds through `own()` or that was
        // reported at creation, with the ids of the component instances
        // using it.
        listActivities(): ActivityRecord[] {
            const subscribers = usersOf();
            createdActivities.forEach((ref) => {
                const activity = ref.deref();

                activity
                    ? subscribers.has(activity) || subscribers.set(activity, [])
                    : createdActivities.delete(ref);
            });

            const owners = ownersOf();

            owners.forEach(
                (_owner, activity) =>
                    subscribers.has(activity) || subscribers.set(activity, [])
            );

            return Array.from(subscribers, ([activity, nodeIds]) =>
                activityRecord(activity, nodeIds, owners.get(activity))
            );
        },
        nodeDetails(ctx: ComponentContextPartial): NodeDetails {
            const kind = kindOf(ctx)!;
            const owners = ownersOf();
            const users = usersOf();

            return {
                activities: activitiesOf(ctx).map((activity) =>
                    activityRecord(
                        activity,
                        users.get(activity),
                        owners.get(activity)
                    )
                ),
                kind,
                lifeCycle: ctx.lifeCycleState?.value ?? null,
                name: nodeNameOf(ctx),
                owned: encode(ctx.owned?.values ?? [], ctx),
                props: encode(
                    kind === 'component' ? ctx.props : undefined,
                    ctx
                ),
                refs: ctx.refs?.size ?? 0
            };
        },
        tree() {
            const nodes: TreeNode[] = [];
            const rootIds: number[] = [];
            const toNode = (
                ctx: ComponentContextPartial,
                parentId?: number
            ) => {
                const id = ids.idOf(ctx);
                const children = childContextsOf(ctx);
                const node: TreeNode = {
                    childIds: children.map((child) => ids.idOf(child)),
                    id,
                    kind: kindOf(ctx)!,
                    name: nodeNameOf(ctx),
                    parentId
                };

                ctx.key !== undefined && (node.key = ctx.key);
                nodes.push(node);
                children.forEach((child) => toNode(child, id));
            };

            getAppRoots()
                .filter((ctx) => kindOf(ctx))
                .forEach((ctx) => {
                    rootIds.push(ids.idOf(ctx));
                    toNode(ctx);
                });

            return { nodes, rootIds };
        },
        walk
    };
};

export type Inspector = ReturnType<typeof createInspector>;
