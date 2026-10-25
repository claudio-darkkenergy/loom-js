// Where the HUD runs: a docked frame in the page or a popup window. Both
// load the prebuilt frontend document, so the HUD never shares the page's
// core instance, styles or component tree.
import { frontendDocument } from '../frontend-source';
import type { Placement } from '../protocol/types';

const POPUP_NAME = 'loom-devtools';
export const HUD_ROOT_ID = 'loom-devtools-hud';

const DOCK_STYLE = {
    background: '#19191c',
    border: '0',
    borderTop: '2px solid #6d28d9',
    bottom: '0',
    height: '40vh',
    left: '0',
    position: 'fixed',
    width: '100%',
    zIndex: '2147483645'
};

export const createHosts = (view: Window) => {
    const doc = view.document;
    let dock: HTMLIFrameElement | undefined;
    let popup: Window | null = null;

    const closeDock = () => {
        dock?.remove();
        dock = undefined;
    };
    const openDock = () => {
        if (dock) {
            return;
        }

        dock = doc.createElement('iframe');
        dock.title = 'loom devtools';
        dock.srcdoc = frontendDocument();
        Object.assign(dock.style, DOCK_STYLE);
        doc.documentElement.append(dock);
    };
    // Reading another origin's document throws; such a window is never ours.
    const isSameOrigin = (opened: Window) => {
        try {
            return !!opened.document;
        } catch {
            return false;
        }
    };
    // Why the popup did not open, or `undefined` when it did.
    const openPopup = () => {
        const opened = view.open('', POPUP_NAME, 'popup,width=960,height=640');

        if (!opened) {
            return 'the browser blocked the popup';
        }

        if (!isSameOrigin(opened)) {
            return 'could not open the popup: a window from another origin holds its name';
        }

        popup = opened;
        closeDock();

        // A popup that survived a page reload already runs the frontend.
        if (!opened.document.getElementById(HUD_ROOT_ID)) {
            opened.document.open();
            opened.document.write(frontendDocument());
            opened.document.close();
        }

        opened.focus();

        return undefined;
    };

    return {
        close() {
            closeDock();
            popup?.close();
            popup = null;
        },
        // A window the backend talks to: its dock frame, its popup, or a
        // popup a previous load of this page opened.
        isPeer(source: Window) {
            try {
                return (
                    source === dock?.contentWindow ||
                    source === popup ||
                    source.opener === view
                );
            } catch {
                return false;
            }
        },
        open(placement: Placement): Placement {
            if (placement === 'popup') {
                const failure = openPopup();

                if (!failure) {
                    return 'popup';
                }

                console.info(
                    `[loom] devtools: ${failure} — opened the dock instead; use its pop-out button.`
                );
            }

            openDock();

            return 'dock';
        },
        placementOf(source: Window): Placement | 'unknown' {
            return source === dock?.contentWindow
                ? 'dock'
                : source === popup || source.opener === view
                  ? 'popup'
                  : 'unknown';
        }
    };
};

export type Hosts = ReturnType<typeof createHosts>;
