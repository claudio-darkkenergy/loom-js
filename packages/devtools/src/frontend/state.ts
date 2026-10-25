// The HUD's state, as activities, and the actions that move it — the
// views render from these and call the actions; only the actions talk to
// the backend.
import { activity } from '@loom-js/core';

import type {
    ActivityRecord,
    Encoded,
    NodeDetails,
    PathKey,
    Placement,
    Topic,
    TreeNode
} from '../protocol/types';
import type { Client } from './client';

export type Tab = 'activities' | 'components';

export interface Connection {
    message?: string;
    placement: Placement | 'unknown';
    status: 'connected' | 'connecting' | 'refused';
}

export interface TreeState {
    nodes: Map<number, TreeNode>;
    rootIds: number[];
}

export interface Toggles {
    flash: boolean;
    perf: boolean;
    picking: boolean;
}

// Values fetched past the inline depth, by `section.key.key` path.
export type Expansions = Map<string, Encoded>;

export const pathString = (path: PathKey[]) => path.map(String).join('.');

export const createHudState = (client: Client) => {
    const connection = activity<Connection>({
        placement: 'unknown',
        status: 'connecting'
    });
    const tab = activity<Tab>('components');
    const tree = activity<TreeState>({ nodes: new Map(), rootIds: [] });
    const collapsed = activity<Set<number>>(new Set());
    const selectedId = activity<number | undefined>(undefined);
    const details = activity<NodeDetails | undefined>(undefined);
    const expansions = activity<Expansions>(new Map());
    const openPaths = activity<Set<string>>(new Set());
    const activities = activity<ActivityRecord[]>([]);
    const renderCounts = activity<Map<number, number>>(new Map());
    const toggles = activity<Toggles>({
        flash: false,
        perf: false,
        picking: false
    });
    const notice = activity<string>('');

    const topics = (): Topic[] => {
        const { flash, perf } = toggles.value();

        return [
            'activities',
            'renders',
            'tree',
            ...(flash ? (['flash'] as const) : []),
            ...(perf ? (['perf'] as const) : [])
        ];
    };
    const report = (error: unknown) =>
        notice.update(error instanceof Error ? error.message : String(error));

    const refreshTree = async () => {
        const { nodes, rootIds } = await client.request('tree.get');

        tree.update({
            nodes: new Map(nodes.map((node) => [node.id, node])),
            rootIds
        });

        const current = selectedId.value();

        current !== undefined && !nodes.some(({ id }) => id === current)
            ? select(undefined)
            : current !== undefined && refreshDetails();
    };
    const refreshDetails = async () => {
        const id = selectedId.value();

        if (id === undefined) {
            details.update(undefined);
            return;
        }

        const result = await client.request('node.inspect', { id });

        'kind' in result && selectedId.value() === id && details.update(result);
    };
    const refreshActivities = async () => {
        activities.update((await client.request('activity.list')).activities);
    };
    const select = (id: number | undefined) => {
        selectedId.update(id);
        expansions.update(new Map());
        openPaths.update(new Set());
        details.update(undefined);
        client.request('select', { id: id ?? null }).catch(report);
        id !== undefined && refreshDetails().catch(report);
    };

    client.onConnected(async (hello) => {
        connection.update({ placement: hello.placement, status: 'connected' });
        notice.update('');

        try {
            await client.request('subscribe', { topics: topics() });
            await Promise.all([refreshTree(), refreshActivities()]);
            hello.selectedId !== undefined && select(hello.selectedId);
        } catch (error) {
            report(error);
        }
    });
    client.onDisconnected((error) =>
        connection.update({
            message: error?.message,
            placement: connection.value().placement,
            status:
                error?.code === 'protocol-mismatch' ? 'refused' : 'connecting'
        })
    );

    let treeRefresh: Promise<void> | undefined;

    client.on('tree.changed', () => {
        // One refetch in flight at a time; events during it fold into it.
        treeRefresh ??= Promise.resolve()
            .then(refreshTree)
            .catch(report)
            .finally(() => (treeRefresh = undefined));
    });
    client.on('renders', ({ entries }) => {
        const counts = new Map(renderCounts.value());

        entries.forEach(({ id }) => counts.set(id, (counts.get(id) ?? 0) + 1));
        renderCounts.update(counts);
    });
    client.on('activity.changed', ({ id, pending, value }) => {
        const known = activities.value();

        known.some((record) => record.id === id)
            ? activities.update(
                  known.map((record) =>
                      record.id === id ? { ...record, pending, value } : record
                  )
              )
            : refreshActivities().catch(report);

        const shown = details.value();

        shown?.activities.some((record) => record.id === id) &&
            details.update({
                ...shown,
                activities: shown.activities.map((record) =>
                    record.id === id ? { ...record, pending, value } : record
                )
            });
    });
    client.on('selected', ({ id }) => {
        tab.update('components');
        select(id);
    });
    client.on('pick.ended', () =>
        toggles.update({ ...toggles.value(), picking: false })
    );

    const setToggle = async (name: keyof Toggles, on: boolean) => {
        toggles.update({ ...toggles.value(), [name]: on });

        try {
            name === 'picking'
                ? await client.request('pick', { on })
                : await client.request('subscribe', { topics: topics() });
        } catch (error) {
            report(error);
        }
    };

    return {
        activities,
        collapsed,
        connection,
        details,
        expansions,
        notice,
        openPaths,
        renderCounts,
        selectedId,
        tab,
        toggles,
        tree,
        actions: {
            close: () => client.request('close').catch(report),
            editActivity: async (id: number, text: string) => {
                try {
                    await client.request('activity.update', {
                        id,
                        input: JSON.parse(text)
                    });
                    notice.update('');
                } catch (error) {
                    report(
                        error instanceof SyntaxError
                            ? `Not JSON: ${error.message}`
                            : error
                    );
                }
            },
            // Fetches a value past the inline depth: an activity's (`a<id>`)
            // or the selected instance's (`props` / `owned`).
            expand: async (path: PathKey[]) => {
                const [section, ...rest] = path;
                const result =
                    typeof section === 'string' && section.startsWith('a')
                        ? await client.request('activity.inspect', {
                              id: Number(section.slice(1)),
                              path: rest
                          })
                        : await client.request('node.inspect', {
                              id: selectedId.value()!,
                              path
                          });

                if ('value' in result) {
                    const next = new Map(expansions.value());

                    next.set(pathString(path), result.value);
                    expansions.update(next);
                }
            },
            highlight: (id: number | null) =>
                client.request('highlight', { id }).catch(report),
            log: (id: number) => client.request('log', { id }).catch(report),
            popOut: () =>
                client.request('open', { placement: 'popup' }).catch(report),
            dock: () =>
                client.request('open', { placement: 'dock' }).catch(report),
            resetActivity: (id: number) =>
                client.request('activity.reset', { id }).catch(report),
            reveal: (id: number) =>
                client.request('reveal', { id }).catch(report),
            select,
            setTab: (next: Tab) => tab.update(next),
            setToggle,
            togglePath: (path: PathKey[]) => {
                const next = new Set(openPaths.value());
                const key = pathString(path);

                next.has(key) ? next.delete(key) : next.add(key);
                openPaths.update(next);
            },
            toggleCollapsed: (id: number) => {
                const next = new Set(collapsed.value());

                next.has(id) ? next.delete(id) : next.add(id);
                collapsed.update(next);
            }
        }
    };
};

export type HudState = ReturnType<typeof createHudState>;
