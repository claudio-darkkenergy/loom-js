// The `loom` console API — `tree()`, `inspect(node)`, `activities()` — lives
// on the page's `loom` global while devtools runs, so core ships none of it.
import {
    inspectActivities,
    inspectNode,
    inspectTree
} from '@loom-js/core/devtools';

const CONSOLE_API = {
    activities: inspectActivities,
    inspect: inspectNode,
    tree: inspectTree
};

type ConsoleHost = { loom?: Record<string, unknown> };

/**
 * Adds the console API to a window's `loom` global; returns the removal.
 * @param view The page window.
 */
export const installConsoleApi = (view: Window) => {
    const loom = (view as unknown as ConsoleHost).loom;

    loom && Object.assign(loom, CONSOLE_API);

    return () => {
        loom && Object.keys(CONSOLE_API).forEach((key) => delete loom[key]);
    };
};
