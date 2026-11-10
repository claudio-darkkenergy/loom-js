// A modal dialog draws above the whole page and makes everything outside it
// inert, the dock included. The backend's nodes move into the topmost open
// modal dialog, and back out when it closes, so the HUD stays usable.

const isModal = (dialog: Element) => {
    try {
        return dialog.matches(':modal');
    } catch {
        return false;
    }
};

/**
 * Reports where the backend's page nodes belong: the topmost open modal
 * dialog, or the document element.
 * @param doc The inspected page's document.
 * @param onTarget Called with the new parent whenever it changes.
 * @returns A function that stops following.
 */
export const followModalDialogs = (
    doc: Document,
    onTarget: (target: Element) => void
) => {
    // Open modal dialogs in the order they opened; the last is on top.
    const stack: Element[] = [];
    let current: Element = doc.documentElement;

    const sync = () => {
        stack.splice(
            0,
            stack.length,
            ...stack.filter((dialog) => dialog.isConnected && isModal(dialog))
        );
        doc.querySelectorAll('dialog[open]').forEach(
            (dialog) =>
                isModal(dialog) && !stack.includes(dialog) && stack.push(dialog)
        );

        const target = stack.at(-1) ?? doc.documentElement;

        if (target !== current) {
            current = target;
            onTarget(target);
        }
    };
    // Child-list changes catch a dialog removed while open.
    const observer = new MutationObserver(sync);

    observer.observe(doc.documentElement, {
        attributeFilter: ['open'],
        childList: true,
        subtree: true
    });
    sync();

    return () => observer.disconnect();
};
