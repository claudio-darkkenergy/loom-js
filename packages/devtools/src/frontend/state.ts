// The HUD's state, as activities, and the actions that move it — the
// views render from these and call the actions; only the actions talk to
// the backend.
import { activity } from '@loom-js/core';

import type {
    ActivityRecord,
    DockPosition,
    DockState,
    Encoded,
    NodeDetails,
    PathKey,
    Topic,
    TreeNode
} from '../protocol/types';
import type { Client } from './client';

export type Tab = 'activities' | 'components';

// Which panel a one-panel Components tab shows.
export type Panel = 'details' | 'tree';

// Below this HUD width the tree and details take turns.
const NARROW_QUERY = '(max-width: 699px)';

export interface Connection {
    message?: string;
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
    const connection = activity<Connection>({ status: 'connecting' });
    const tab = activity<Tab>('components');
    const tree = activity<TreeState>({ nodes: new Map(), rootIds: [] });
    const collapsed = activity<Set<number>>(new Set());
    const selectedId = activity<number | undefined>(undefined);
    // A picked instance whose tree row should scroll into view once shown.
    const revealId = activity<number | undefined>(undefined);
    // Whether the selected instance is wholly in view in the page.
    const selectionInView = activity(false);
    // An activity whose Activities-tab item should scroll into view.
    const revealActivityId = activity<number | undefined>(undefined);
    const dock = activity<DockState | undefined>(undefined);
    const panel = activity<Panel>('tree');
    const narrowQuery = globalThis.matchMedia?.(NARROW_QUERY);
    const narrow = activity(!!narrowQuery?.matches);

    narrowQuery?.addEventListener('change', ({ matches }) =>
        narrow.update(matches)
    );
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

    // Expands every collapsed ancestor of a node so its row is shown.
    const expandTo = (id: number) => {
        const { nodes } = tree.value();
        const next = new Set(collapsed.value());
        let parentId = nodes.get(id)?.parentId;

        while (parentId !== undefined) {
            next.delete(parentId);
            parentId = nodes.get(parentId)?.parentId;
        }

        collapsed.update(next);
    };

    client.onConnected(async (hello) => {
        connection.update({ status: 'connected' });
        dock.update(hello.dock);
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
    // Whether the Components tab shows one panel at a time: docked at the
    // side, or too narrow for the tree and details side by side (a small
    // floating window).
    const isOnePanel = () => narrow.value() || dock.value()?.edge === 'side';
    // Selects an instance on the Components tab: its details, in a
    // one-panel HUD, or its row scrolled into view beside them.
    const showInstance = (id: number) => {
        tab.update('components');
        expandTo(id);
        select(id);
        revealId.update(id);
        isOnePanel() && panel.update('details');
    };

    client.on('selected', ({ id }) => showInstance(id));
    client.on('selection.view', ({ inView }) => selectionInView.update(inView));
    client.on('dock.changed', (state) => dock.update(state));
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
        dock,
        expansions,
        isOnePanel,
        narrow,
        notice,
        openPaths,
        panel,
        renderCounts,
        revealActivityId,
        revealId,
        selectedId,
        selectionInView,
        tab,
        toggles,
        tree,
        actions: {
            close: () => client.request('close').catch(report),
            // Applies an edit; resolves with why it failed, or `undefined`.
            editActivity: async (id: number, text: string) => {
                try {
                    await client.request('activity.update', {
                        id,
                        input: JSON.parse(text)
                    });
                    return undefined;
                } catch (error) {
                    return error instanceof SyntaxError
                        ? `Not JSON: ${error.message}`
                        : error instanceof Error
                          ? error.message
                          : String(error);
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
            // Floats the HUD over the page, or docks it again.
            float: () =>
                client.request('open', { placement: 'float' }).catch(report),
            dock: () =>
                client.request('open', { placement: 'dock' }).catch(report),
            resetActivity: (id: number) =>
                client.request('activity.reset', { id }).catch(report),
            resetRenderCounts: () => renderCounts.update(new Map()),
            // Back from a one-panel HUD's details to the tree, at the
            // selected row.
            backToTree: () => {
                panel.update('tree');
                revealId.update(selectedId.value());
            },
            // Opens a tree row's details: beside the tree, or in its place.
            openDetails: (id: number) => {
                select(id);
                isOnePanel() && panel.update('details');
            },
            placeDock: async (position: DockPosition) => {
                try {
                    dock.update(
                        await client.request('dock.place', { position })
                    );
                } catch (error) {
                    report(error);
                }
            },
            activityRevealed: () => revealActivityId.update(undefined),
            revealed: () => revealId.update(undefined),
            reveal: (id: number) =>
                client.request('reveal', { id }).catch(report),
            select,
            setTab: (next: Tab) => tab.update(next),
            showInstance,
            // Shows the instance after the selected one in `ids`, wrapping.
            showNextInstance: (ids: number[]) => {
                const current = ids.indexOf(selectedId.value() ?? -1);

                showInstance(ids[(current + 1) % ids.length]!);
            },
            // Opens the Activities tab at one activity.
            showActivity: (id: number) => {
                tab.update('activities');
                revealActivityId.update(id);
            },
            toggleDock: async () => {
                try {
                    dock.update(
                        await client.request('dock.resize', {
                            collapsed: !dock.value()?.collapsed
                        })
                    );
                } catch (error) {
                    report(error);
                }
            },
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
