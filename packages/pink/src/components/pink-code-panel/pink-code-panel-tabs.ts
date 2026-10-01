import {
    type activity,
    component,
    type ComponentInputProps
} from '@loom-js/core';
import classNames from 'classnames';

// The selection as the tab strip uses it: `bind` reflects the selected label
// on the tabs already in the DOM, `update` selects one.
export type CodePanelTabSelection = Pick<
    ReturnType<typeof activity<string>>,
    'bind' | 'update'
>;

/**
 * The label a panel shows for a selection: the selection itself when the
 * panel has that tab, otherwise the panel's first tab. A shared selection can
 * name a label some panels don't carry.
 */
export const resolveCodePanelTab = (
    labels: string[],
    selectedLabel: string
): string | undefined =>
    labels.includes(selectedLabel) ? selectedLabel : labels[0];

export type PinkCodePanelTabsProps = ComponentInputProps<{
    // One tab per label, in order.
    labels: string[];
    // The selected label. Panels sharing one activity switch together.
    selection: CodePanelTabSelection;
    // Names the tab list for assistive technology.
    tabsLabel?: string;
}>;

type CodePanelTabProps = {
    label: string;
    labels: string[];
    selection: CodePanelTabSelection;
};

const CodePanelTab = component<CodePanelTabProps>(
    (html, { label, labels, selection }) => {
        const isSelected = (selectedLabel: string) =>
            resolveCodePanelTab(labels, selectedLabel) === label;

        return html`
            <button
                $click=${() => selection.update(label)}
                aria-selected=${selection.bind((selectedLabel) =>
                    String(isSelected(selectedLabel))
                )}
                class=${selection.bind((selectedLabel) =>
                    classNames('tabs-button', {
                        'is-selected': isSelected(selectedLabel)
                    })
                )}
                role="tab"
                type="button"
            >
                <span class="text">${label}</span>
            </button>
        `;
    }
);

/**
 * The panel header's tab strip: one button per label, for switching between
 * variants of the same code. The selected tab follows the `selection`
 * activity in place, so the strip never re-renders.
 */
export const PinkCodePanelTabs = component<PinkCodePanelTabsProps>(
    (
        html,
        {
            attrs,
            className,
            id,
            labels,
            on,
            selection,
            style,
            tabsLabel = 'Code variants'
        }
    ) => html`
        <div
            $attrs=${attrs}
            $on=${on}
            class=${classNames(className, 'tabs code-panel-tabs')}
            id=${id}
            style=${style}
        >
            <div aria-label=${tabsLabel} class="tabs-list" role="tablist">
                ${labels.map((label) =>
                    CodePanelTab({ label, labels, selection })
                )}
            </div>
        </div>
    `
);
