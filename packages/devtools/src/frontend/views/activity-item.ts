import { component } from '@loom-js/core';

import type { ActivityRecord, ActivityRef } from '../../protocol/types';
import type { HudState, TreeState } from '../state';
import { ActivityValue } from './activity-value';
import { centerInPane, flashShown } from './scroll';
import type { ValueContext } from './value-view';

// The instances using an activity, named from the tree.
export const usersOf = ({ subscriberIds }: ActivityRecord, tree: TreeState) =>
    subscriberIds.flatMap((id): ActivityRef[] => {
        const node = tree.nodes.get(id);

        return node ? [{ id, name: node.name }] : [];
    });

export interface ActivityItemProps {
    actions: HudState['actions'];
    // Shown on the Components tab: a way over to the Activities tab.
    linkToActivities?: boolean;
    record: ActivityRecord;
    // Scroll this item into view once it renders.
    reveal?: boolean;
    // The instances using the activity, named.
    users: ActivityRef[];
    valueContext: ValueContext;
}

export const ActivityItem = component<ActivityItemProps>(
    (
        html,
        {
            actions,
            linkToActivities,
            onRendered,
            record,
            reveal,
            users,
            valueContext
        }
    ) => {
        const { id, name, owner, pending } = record;

        // Registered on every render: a handler list locks after its first
        // registration, so the current `reveal` is read from the item.
        onRendered((rendered) => {
            if ((rendered as HTMLElement).dataset.reveal) {
                centerInPane(rendered as Element);
                flashShown(rendered as Element);
                actions.activityRevealed();
            }
        });

        return html`
            <li
                class="activity-item"
                data-activity-id=${id}
                data-reveal=${reveal ? 'true' : undefined}
            >
                <div class="activity-head">
                    <span class="activity-name">${name}</span>
                    ${pending ? '⏳ pending' : ''}
                    <span class="hud-spacer"></span>
                    ${linkToActivities ? ShowInActivities({ actions, activityId: id }) : ''}
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
                ${ActivityUsers({ actions, users })}
                ${ActivityScope({ actions, owner })}
                ${ActivityValue({ actions, record, valueContext })}
            </li>
        `;
    },
    { name: 'ActivityItem' }
);

const ShowInActivities = component<{
    actions: HudState['actions'];
    activityId: number;
}>(
    (html, { actions, activityId }) => html`
        <button
            class="hud-button"
            $click=${() => actions.showActivity(activityId)}
            title="Show this activity in the Activities tab"
            type="button"
        >
            Show in Activities
        </button>
    `,
    { name: 'ShowInActivities' }
);

// Which rendered instances use the activity: render one of its effects or
// bind it to an attribute. Each name selects that instance.
const ActivityUsers = component<{
    actions: HudState['actions'];
    users: ActivityRef[];
}>(
    (html, { actions, users }) => html`
        <div class="activity-users hud-muted">
            ${users.length ? UserLinks({ actions, users }) : NoUsers()}
        </div>
    `,
    { name: 'ActivityUsers' }
);

// Users grouped by name, in tree order: many instances of one component
// read as one link that steps through them.
const groupByName = (users: ActivityRef[]) => {
    const groups = new Map<string, number[]>();

    users.forEach(({ id, name }) =>
        groups.set(name, [...(groups.get(name) ?? []), id])
    );

    return Array.from(groups);
};

const UserLinks = component<{
    actions: HudState['actions'];
    users: ActivityRef[];
}>(
    (html, { actions, users }) => html`
        used by
        ${groupByName(users).map(([name, ids]) =>
            InstanceLink({
                key: name,
                name: ids.length > 1 ? `${name} ×${ids.length}` : name,
                onSelect: () => actions.showNextInstance(ids),
                title:
                    ids.length > 1
                        ? `Show the next of ${ids.length} ${name} instances in the Components tab`
                        : 'Show this instance in the Components tab'
            })
        )}
    `,
    { name: 'UserLinks' }
);

const NoUsers = component(
    (html) => html`
        <span
            title="No mounted instance renders one of its effects or binds it right now"
        >
            not used by a rendered instance
        </span>
    `,
    { name: 'NoUsers' }
);

// Whose lifetime the activity shares: the instance holding it through
// `own()`, or none.
const ActivityScope = component<{
    actions: HudState['actions'];
    owner: ActivityRecord['owner'];
}>(
    (html, { actions, owner }) => html`
        <div class="activity-scope hud-muted">
            ${
                owner
                    ? OwnerLink({
                          name: owner.name,
                          onSelect: () => actions.showInstance(owner.id)
                      })
                    : NoOwner()
            }
        </div>
    `,
    { name: 'ActivityScope' }
);

const OwnerLink = component<{ name: string; onSelect(): void }>(
    (html, { name, onSelect }) => html`
        owned by
        ${InstanceLink({ name, onSelect, title: 'Select the owning instance' })}
    `,
    { name: 'OwnerLink' }
);

const NoOwner = component(
    (html) => html`
        <span
            title="Not created through an instance's own(): it lives at module scope, or a render creates it anew"
        >
            no owner: module scope, or created without own()
        </span>
    `,
    { name: 'NoOwner' }
);

const InstanceLink = component<{
    name: string;
    onSelect(): void;
    title: string;
}>(
    (html, { name, onSelect, title }) => html`
        <button
            class="owner-link"
            $click=${onSelect}
            title=${title}
            type="button"
        >
            ${name}
        </button>
    `,
    { name: 'InstanceLink' }
);
