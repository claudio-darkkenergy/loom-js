import { component } from '@loom-js/core';

import type { NodeDetails, TreeNode } from '../../protocol/types';
import { derive } from '../derive';
import type { HudState } from '../state';
import { ActivityItem } from './activity-item';
import { type ValueContext, ValueRow } from './value-view';

interface TreeRowModel {
    collapsed: boolean;
    count: number;
    depth: number;
    node: TreeNode;
    selected: boolean;
}

interface TreeRowProps {
    actions: HudState['actions'];
    row: TreeRowModel;
}

const TreeRow = component<TreeRowProps>(
    (
        html,
        { actions, row: { collapsed, count, depth, node, selected } }
    ) => html`
        <li
            class=${`tree-row ${selected ? 'is-selected' : ''}`}
            $click=${() => actions.select(node.id)}
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
                type="button"
            >
                ${collapsed ? '▸' : '▾'}
            </button>
            <span class=${`tree-name is-${node.kind}`}>${node.name}</span>
            ${node.key !== undefined ? KeyBadge({ text: `key=${String(node.key)}` }) : ''}
            ${count ? KeyBadge({ text: `×${count}`, title: 'renders' }) : ''}
        </li>
    `,
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
                    state.renderCounts
                ],
                (tree, collapsed, selectedId, counts) => {
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
    onSelectNode: (id) => state.actions.select(id),
    onToggle: (path) => state.actions.togglePath(path),
    openPaths
});

interface DetailsProps {
    details: NodeDetails;
    nodeId: number;
    state: HudState;
    valueContext: ValueContext;
}

const Details = component<DetailsProps>(
    (html, { details, nodeId, state, valueContext }) => {
        const { actions } = state;
        const hasOwned =
            details.owned.t === 'array' && details.owned.length > 0;

        return html`
            <div class="details">
                <div class="details-head">
                    <span class=${`details-name is-${details.kind}`}>
                        ${details.name}
                    </span>
                    <span class="hud-muted">${details.lifeCycle ?? ''}</span>
                    <span class="hud-spacer"></span>
                    <button
                        class="hud-button"
                        $click=${() => actions.reveal(nodeId)}
                        type="button"
                    >
                        Scroll to
                    </button>
                    <button
                        class="hud-button"
                        $click=${() => actions.log(nodeId)}
                        type="button"
                    >
                        Log
                    </button>
                </div>
                ${
                    details.kind === 'component'
                        ? Section({
                              children: ValueRow({
                                  context: valueContext,
                                  label: 'props',
                                  path: ['props'],
                                  value: details.props
                              }),
                              title: 'Props'
                          })
                        : ''
                }
                ${
                    details.activities.length
                        ? Section({
                              children: details.activities.map((record) =>
                                  ActivityItem({
                                      actions,
                                      key: record.id,
                                      record,
                                      valueContext
                                  })
                              ),
                              title: 'Activities'
                          })
                        : ''
                }
                ${
                    hasOwned
                        ? Section({
                              children: ValueRow({
                                  context: valueContext,
                                  label: 'own()',
                                  path: ['owned'],
                                  value: details.owned
                              }),
                              title: 'Owned values'
                          })
                        : ''
                }
            </div>
        `;
    },
    { name: 'Details' }
);

const Section = component<{ title: string }>(
    (html, { children, title }) => html`
        <section class="details-section">
            <h3 class="details-title">${title}</h3>
            <ul class="value-list">
                ${children}
            </ul>
        </section>
    `,
    { name: 'Section' }
);

export const InspectorPane = component<{ state: HudState }>(
    (html, { own, state }) => {
        const view = own(() =>
            derive(
                [
                    state.details,
                    state.selectedId,
                    state.expansions,
                    state.openPaths
                ],
                (details, selectedId, expansions, openPaths) => ({
                    details,
                    selectedId,
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
                    ({ value: { details, selectedId, valueContext } }) =>
                        details && selectedId !== undefined
                            ? Details({
                                  details,
                                  nodeId: selectedId,
                                  state,
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
                [state.activities, state.expansions, state.openPaths],
                (records, expansions, openPaths) => ({
                    records,
                    valueContext: valueContextOf(state, expansions, openPaths)
                })
            )
        );

        return html`
            <section class="pane activities-pane" aria-label="Activities">
                <ul class="activity-list">
                    ${view.effect(({ value: { records, valueContext } }) =>
                        records.length
                            ? records.map((record) =>
                                  ActivityItem({
                                      actions: state.actions,
                                      key: record.id,
                                      record,
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
