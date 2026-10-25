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
    findOwnerContext,
    getAppRoots,
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
    const describeSpecial: DescribeSpecial = (value) => {
        if (isInspectableActivity(value)) {
            return {
                id: ids.idOf(value),
                name: describeActivity(value).name,
                t: 'activity'
            };
        }

        if (typeof Node !== 'undefined' && value instanceof Node) {
            const owner = findOwnerContext(value);
            const ownsRoot =
                owner &&
                (Array.isArray(owner.root)
                    ? owner.root[0] === value
                    : owner.root === value);

            return {
                id: ownsRoot ? ids.idOf(owner) : undefined,
                t: 'node',
                tag: value.nodeName.toLowerCase()
            };
        }

        const kind =
            typeof value === 'function' &&
            (value as ContextFunctionValue).contextFunctionKind;

        if (kind === 'component') {
            // A dry run returns a throwaway snapshot — it never renders.
            return {
                name: displayNameOf((value as ContextFunctionValue)({}, true)),
                t: 'component'
            };
        }

        return kind === 'activity'
            ? { name: 'activity effect', t: 'fn' }
            : undefined;
    };
    const encode = (value: unknown): Encoded =>
        encodeValue(value, describeSpecial);

    const walk = (visit: (ctx: ComponentContextPartial) => void) => {
        const step = (ctx: ComponentContextPartial) => {
            visit(ctx);
            childContextsOf(ctx).forEach(step);
        };

        getAppRoots()
            .filter((ctx) => kindOf(ctx))
            .forEach(step);
    };

    const activityRecord = (
        activity: InspectableActivity,
        subscriberIds: number[] = []
    ): ActivityRecord => {
        const { name, pending, value } = describeActivity(activity);

        return {
            editable: isJsonValue(value),
            id: ids.idOf(activity),
            name,
            pending,
            subscriberIds,
            value: encode(value)
        };
    };

    return {
        activityRecord,
        describeSpecial,
        encode,
        noteCreated(activity: InspectableActivity) {
            createdActivities.add(new WeakRef(activity));
        },
        // Every activity the tree uses or that was reported at creation,
        // with the ids of the component instances using it.
        listActivities(): ActivityRecord[] {
            const subscribers = new Map<InspectableActivity, number[]>();

            walk((ctx) =>
                (kindOf(ctx) === 'component' ? activitiesOf(ctx) : []).forEach(
                    (activity) => {
                        const nodeIds = subscribers.get(activity) ?? [];

                        nodeIds.push(ids.idOf(ctx));
                        subscribers.set(activity, nodeIds);
                    }
                )
            );
            createdActivities.forEach((ref) => {
                const activity = ref.deref();

                activity
                    ? subscribers.has(activity) || subscribers.set(activity, [])
                    : createdActivities.delete(ref);
            });

            return Array.from(subscribers, ([activity, nodeIds]) =>
                activityRecord(activity, nodeIds)
            );
        },
        nodeDetails(ctx: ComponentContextPartial): NodeDetails {
            const kind = kindOf(ctx)!;

            return {
                activities: activitiesOf(ctx).map((activity) =>
                    activityRecord(activity)
                ),
                kind,
                lifeCycle: ctx.lifeCycleState?.value ?? null,
                name: nodeNameOf(ctx),
                owned: encode(ctx.owned?.values ?? []),
                props: encode(kind === 'component' ? ctx.props : undefined),
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
