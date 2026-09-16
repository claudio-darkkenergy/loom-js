// The shell ↔ boot contract: one module names the slots the shell template
// emits, the prerender injector fills, and the client boot reads, so the
// three can't drift apart.

/**
 * The id of the shell-owned app root element. Namespaced because a bare
 * `#app` collides with app-targeted CSS rules.
 */
export const APP_ROOT_ID = 'loom-app';

/**
 * The id of the state script element — it carries a prerendered route's
 * dehydrated resource payload, and stays empty in dev/fallback shells.
 */
export const STATE_SCRIPT_ID = 'loom-state';

/**
 * The empty app-root slot exactly as the shell template emits it. The
 * prerender injector fills it by replacing this literal string.
 */
export const appRootSlot = `<div id="${APP_ROOT_ID}" style="height: 100%"></div>`;

/**
 * The empty state-script slot exactly as the shell template emits it. The
 * prerender injector fills it by replacing this literal string.
 */
export const stateScriptSlot = `<script id="${STATE_SCRIPT_ID}" type="application/json"></script>`;

/**
 * Inline head script: keeps the viewport pinned to the URL fragment while
 * the document streams in, so the anchor is in place from the first
 * painted frame. A user scroll cancels it; parse end stops it.
 */
export const fragmentBootScript = `<script>
    (() => {
        var hash = location.hash.slice(1);

        if (!hash) return;

        hash = decodeURIComponent(hash);

        var stopped = false;
        var observer = new MutationObserver(align);

        function align() {
            if (stopped) return;

            var target = document.getElementById(hash);

            target &&
                target.scrollIntoView({ behavior: 'instant', block: 'start' });
        }

        function cancel() {
            stopped = true;
            observer.disconnect();
        }

        ['wheel', 'touchstart', 'keydown'].forEach((event) =>
            addEventListener(event, cancel, { once: true, passive: true })
        );
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        document.addEventListener('DOMContentLoaded', () => {
            align();
            observer.disconnect();
        });
        // Late resources (fonts, images) can shift the anchor after parse.
        addEventListener('load', align, { once: true });
        document.fonts && document.fonts.ready.then(align);
    })();
</script>`;

export interface PrerenderPayload {
    appHtml: string;
    stateJson: string;
}

/**
 * Fills a shell's boot slots with a prerendered route's markup and state.
 * Throws when a slot is missing, so a drifted shell fails the build
 * instead of shipping an empty page.
 */
export const injectPrerender = (
    shellHtml: string,
    { appHtml, stateJson }: PrerenderPayload
) => {
    if (
        !shellHtml.includes(appRootSlot) ||
        !shellHtml.includes(stateScriptSlot)
    ) {
        throw new Error(
            '[prerender] shell is missing a boot slot — the html template and boot contract have drifted.'
        );
    }

    // Function replacements, since the payloads may contain `$` sequences
    // that `String.replace` would otherwise interpret.
    return shellHtml
        .replace(
            appRootSlot,
            () =>
                `<div id="${APP_ROOT_ID}" style="height: 100%">${appHtml}</div>`
        )
        .replace(
            stateScriptSlot,
            () =>
                `<script id="${STATE_SCRIPT_ID}" type="application/json">${stateJson}</script>`
        );
};
