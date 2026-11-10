import { component } from '@loom-js/core';

import type { TreeNode } from '../../protocol/types';
import { derive } from '../derive';
import type { HudState } from '../state';
import { ActivityItem, usersOf } from './activity-item';
import { Chevron } from './chevron';
import { Details } from './details';
import { centerInPane } from './scroll';
import type { ValueContext } from './value-view';

interface TreeRowModel {
    collapsed: boolean;
    count: number;
    depth: number;
    node: TreeNode;
    // Scroll this row into view once it renders (a pick in the page).
    reveal: boolean;
    selected: boolean;
}

interface TreeRowProps {
    actions: HudState['actions'];
    row: TreeRowModel;
}

const TreeRow = component<TreeRowProps>(
    (
        html,
        {
            actions,
            onRendered,
            row: { collapsed, count, depth, node, reveal, selected }
        }
    ) => {
        // Registered on every render: a handler list locks after its first
        // registration, so the current `reveal` is read from the row.
        onRendered((rendered) => {
            if ((rendered as HTMLElement).dataset.reveal) {
                centerInPane(rendered as Element);
                actions.revealed();
            }
        });

        return html`
            <li
                class=${`tree-row ${selected ? 'is-selected' : ''}`}
                data-node-id=${node.id}
                data-reveal=${reveal ? 'true' : undefined}
                $click=${() => actions.openDetails(node.id)}
                $mouseenter=${() => actions.highlight(node.id)}
                $mouseleave=${() => actions.highlight(null)}
                style=${`padding-left: ${depth * 14 + 4}px`}
            >
                <button
                    class=${`tree-toggle ${node.childIds.length ? '' : 'is-hidden'}`}
                    $click=${(event: Event) => {
                        event.stopPropagation();
                        actions.toggleCollapsed(node.id);
                    }}
                    aria-label=${collapsed ? 'Expand' : 'Collapse'}
                    type="button"
                >
                    ${Chevron({ direction: collapsed ? 'right' : 'down' })}
                </button>
                <span class=${`tree-name is-${node.kind}`}>${node.name}</span>
                ${node.key !== undefined ? KeyBadge({ text: `key=${String(node.key)}` }) : ''}
                ${count ? KeyBadge({ text: `↻ ${count}`, title: `re-rendered ${count}× since devtools connected` }) : ''}
            </li>
        `;
    },
    { name: 'TreeRow' }
);

const KeyBadge = component<{ text: string; title?: string }>(
    (html, { text, title }) => html`
        <span class="tag hud-badge" title=${title}>${text}</span>
    `,
    { name: 'KeyBadge' }
);

export const TreePane = component<{ state: HudState }>(
    (html, { own, state }) => {
        const rows = own(() =>
            derive(
                [
                    state.tree,
                    state.collapsed,
                    state.selectedId,
                    state.renderCounts,
                    state.revealId
                ],
                (tree, collapsed, selectedId, counts, revealId) => {
                    const visible: TreeRowModel[] = [];
                    const visit = (id: number, depth: number) => {
                        const node = tree.nodes.get(id);

                        if (!node) {
                            return;
                        }

                        visible.push({
                            collapsed: collapsed.has(id),
                            count: counts.get(id) ?? 0,
                            depth,
                            node,
                            reveal: id === revealId,
                            selected: id === selectedId
                        });
                        collapsed.has(id) ||
                            node.childIds.forEach((childId) =>
                                visit(childId, depth + 1)
                            );
                    };

                    tree.rootIds.forEach((id) => visit(id, 0));

                    return visible;
                }
            )
        );

        return html`
            <section class="pane tree-pane" aria-label="Component tree">
                <div class="tree-toolbar">
                    <button
                        class="hud-button"
                        $click=${() => state.actions.resetRenderCounts()}
                        title="Reset the re-render counts (↻) to zero"
                        type="button"
                    >
                        Reset ↻
                    </button>
                </div>
                <ul class="tree-list" role="tree">
                    ${rows.effect(({ value }) =>
                        value.length
                            ? value.map((row) =>
                                  TreeRow({
                                      actions: state.actions,
                                      key: row.node.id,
                                      row
                                  })
                              )
                            : EmptyNote({ text: 'No mounted app yet.' })
                    )}
                </ul>
            </section>
        `;
    },
    { name: 'TreePane' }
);

const EmptyNote = component<{ text: string }>(
    (html, { text }) => html`
        <li class="hud-muted empty-note">${text}</li>
    `,
    { name: 'EmptyNote' }
);

const valueContextOf = (
    state: HudState,
    expansions: ValueContext['expansions'],
    openPaths: Set<string>
): ValueContext => ({
    expansions,
    onExpand: (path) => state.actions.expand(path),
    onHighlightNode: (id) => state.actions.highlight(id),
    onSelectNode: (id) => state.actions.showInstance(id),
    onToggle: (path) => state.actions.togglePath(path),
    openPaths
});

export const InspectorPane = component<{ state: HudState }>(
    (html, { own, state }) => {
        const view = own(() =>
            derive(
                [
                    state.details,
                    state.selectedId,
                    state.selectionInView,
                    state.tree,
                    state.expansions,
                    state.openPaths,
                    state.narrow,
                    state.dock
                ],
                (details, selectedId, inView, tree, expansions, openPaths) => ({
                    details,
                    inView,
                    onePanel: state.isOnePanel(),
                    selectedId,
                    tree,
                    valueContext: valueContextOf(state, expansions, openPaths)
                })
            )
        );

        return html`
            <section
                class="pane inspector-pane"
                aria-label="Selected component"
            >
                ${view.effect(
                    ({
                        value: {
                            details,
                            inView,
                            onePanel,
                            selectedId,
                            tree,
                            valueContext
                        }
                    }) =>
                        details && selectedId !== undefined
                            ? Details({
                                  details,
                                  inView,
                                  nodeId: selectedId,
                                  onePanel,
                                  state,
                                  tree,
                                  valueContext
                              })
                            : Placeholder({
                                  text:
                                      selectedId === undefined
                                          ? 'Select a component in the tree, or pick one in the page.'
                                          : 'Loading…'
                              })
                )}
            </section>
        `;
    },
    { name: 'InspectorPane' }
);

const Placeholder = component<{ text: string }>(
    (html, { text }) => html`
        <p class="hud-muted placeholder">${text}</p>
    `,
    { name: 'Placeholder' }
);

export const ActivitiesPane = component<{ state: HudState }>(
    (html, { own, state }) => {
        const view = own(() =>
            derive(
                [
                    state.activities,
                    state.tree,
                    state.revealActivityId,
                    state.expansions,
                    state.openPaths
                ],
                (records, tree, revealId, expansions, openPaths) => ({
                    records,
                    revealId,
                    tree,
                    valueContext: valueContextOf(state, expansions, openPaths)
                })
            )
        );

        return html`
            <section class="pane activities-pane" aria-label="Activities">
                <ul class="activity-list">
                    ${view.effect(
                        ({
                            value: { records, revealId, tree, valueContext }
                        }) =>
                            records.length
                                ? records.map((record) =>
                                      ActivityItem({
                                          actions: state.actions,
                                          key: record.id,
                                          record,
                                          reveal: record.id === revealId,
                                          users: usersOf(record, tree),
                                          valueContext
                                      })
                                  )
                                : EmptyNote({ text: 'No activities found.' })
                    )}
                </ul>
            </section>
        `;
    },
    { name: 'ActivitiesPane' }
);
