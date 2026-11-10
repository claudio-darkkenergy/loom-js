// Scrolls HUD content inside its own pane only. `scrollIntoView` would
// also scroll the inspected page around the HUD's frame.

const scrollParentOf = (element: Element) => {
    let parent = element.parentElement;

    while (
        parent &&
        !/(auto|scroll)/.test(getComputedStyle(parent).overflowY)
    ) {
        parent = parent.parentElement;
    }

    return parent;
};

/**
 * Centers an element vertically in its scrolling pane.
 * @param element The element to show.
 */
export const centerInPane = (element: Element) => {
    const pane = scrollParentOf(element);

    if (!pane) {
        return;
    }

    const paneRect = pane.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    pane.scrollTop +=
        rect.top - paneRect.top - (pane.clientHeight - rect.height) / 2;
};

/**
 * Briefly highlights an element the user was sent to.
 * @param element The element to flash.
 */
export const flashShown = (element: Element) =>
    element.animate?.(
        [
            { backgroundColor: 'rgb(109 40 217 / 0.35)' },
            { backgroundColor: 'transparent' }
        ],
        { duration: 1200, easing: 'ease-out' }
    );
