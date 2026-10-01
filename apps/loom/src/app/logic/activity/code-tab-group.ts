import { activity } from '@loom-js/core';

export type CodeTabSelection = ReturnType<typeof activity<string>>;

const groupSelections = new Map<string, CodeTabSelection>();

/**
 * The selected tab label for a tabbed code panel. Panels naming the same
 * group share one selection, so picking a tab in one switches them all; a
 * panel without a group gets a selection of its own. The first panel to ask
 * for a group sets its starting label.
 */
export const codeTabGroup = (
    group: string | undefined,
    defaultLabel: string
): CodeTabSelection => {
    if (!group) {
        return activity(defaultLabel);
    }

    const groupSelection = groupSelections.get(group) ?? activity(defaultLabel);

    groupSelections.set(group, groupSelection);

    return groupSelection;
};
