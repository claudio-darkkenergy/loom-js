import { component } from '@loom-js/core';

import type { NodeDetails, TreeNode } from '../../protocol/types';
import type { HudState, TreeState } from '../state';
import { ActivityItem, usersOf } from './activity-item';
import { Chevron } from './chevron';
import { type ValueContext, ValueRow } from './value-view';

// A node's ancestors in the tree, root first.
const ancestorsOf = (id: number, tree: TreeState) => {
    const ancestors: TreeNode[] = [];
    let parentId = tree.nodes.get(id)?.parentId;

    while (parentId !== undefined) {
        const parent = tree.nodes.get(parentId);

        if (!parent) {
            break;
        }

        ancestors.unshift(parent);
        parentId = parent.parentId;
    }

    return ancestors;
};

// Where the instance sits, each ancestor selecting that instance, and in a
// one-panel HUD the way back to the tree.
const DetailsNav = component<{
    actions: HudState['actions'];
    nodeId: number;
    onePanel: boolean;
    tree: TreeState;
}>(
    (html, { actions, nodeId, onePanel, tree }) => html`
        <div class="details-nav">
            ${onePanel ? BackButton({ actions }) : ''}
            <nav aria-label="Ancestors" class="details-path">
                ${ancestorsOf(nodeId, tree).map((ancestor) =>
                    PathLink({ actions, ancestor, key: ancestor.id })
                )}
            </nav>
        </div>
    `,
    { name: 'DetailsNav' }
);

const BackButton = component<{ actions: HudState['actions'] }>(
    (html, { actions }) => html`
        <button
            aria-label="Back to tree"
            class="hud-button back-button"
            $click=${() => actions.backToTree()}
            title="Back to the component tree"
            type="button"
        >
            ${Chevron({ direction: 'left' })} Tree
        </button>
    `,
    { name: 'BackButton' }
);

const PathLink = component<{
    actions: HudState['actions'];
    ancestor: TreeNode;
}>(
    (html, { actions, ancestor }) => html`
        <button
            class="path-link"
            $click=${() => {
                actions.highlight(null);
                actions.openDetails(ancestor.id);
            }}
            $mouseenter=${() => actions.highlight(ancestor.id)}
            $mouseleave=${() => actions.highlight(null)}
            title=${`Select ${ancestor.name}`}
            type="button"
        >
            ${ancestor.name}
        </button>
    `,
    { name: 'PathLink' }
);

interface DetailsProps {
    details: NodeDetails;
    inView: boolean;
    nodeId: number;
    // Shown instead of the tree, so it offers the way back.
    onePanel: boolean;
    state: HudState;
    tree: TreeState;
    valueContext: ValueContext;
}

export const Details = component<DetailsProps>(
    (
        html,
        { details, inView, nodeId, onePanel, state, tree, valueContext }
    ) => {
        const { actions } = state;
        const hasOwned =
            details.owned.t === 'array' && details.owned.length > 0;

        return html`
            <div class="details">
                ${DetailsNav({ actions, nodeId, onePanel, tree })}
                <div class="details-head">
                    <span class=${`details-name is-${details.kind}`}>
                        ${details.name}
                    </span>
                    <span class="hud-muted">${details.lifeCycle ?? ''}</span>
                    <span class="hud-spacer"></span>
                    <button
                        class="hud-button"
                        $click=${() => actions.reveal(nodeId)}
                        disabled=${inView}
                        title=${inView ? 'Already in view in the page' : 'Scroll the page to this instance'}
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
                                      linkToActivities: true,
                                      record,
                                      users: usersOf(record, tree),
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
