import type { ComponentContextPartial } from '../../types';
import { formatDiagnostic } from '../globals/diagnostic-format';
import { loomConsole } from '../globals/loom-console';
import { setDevtoolsHook, startBuffering } from './hook';

/** Where the devtools HUD opens: docked at a page edge or floating over it. */
export type DevtoolsPlacement = 'dock' | 'float';

/** A running devtools implementation, as its module's `activate` returns it. */
export interface DevtoolsBackend {
    deactivate(): void;
    // Without a placement, the HUD opens where it was last.
    open(placement?: DevtoolsPlacement): void;
    select(ctx: ComponentContextPartial): void;
}

/** What core offers a running devtools implementation. */
export interface DevtoolsHost {
    // The HUD was closed, so the next load of this tab doesn't reopen it.
    hudClosed(): void;
}

/** The module a devtools loader resolves to (`@loom-js/devtools`). */
export interface DevtoolsModule {
    activate(host: DevtoolsHost): DevtoolsBackend | Promise<DevtoolsBackend>;
}

export type DevtoolsLoader = () => Promise<DevtoolsModule>;

export interface DevtoolsEnableOptions {
    // Re-enable on the next load of this tab, before the app mounts.
    persist?: boolean;
}

const PERSIST_KEY = 'loom:devtools';
// Set while the HUD is open, so a reload of the tab reopens it.
const HUD_OPEN_KEY = 'loom:devtools:open';
let loader: DevtoolsLoader | undefined;
let running: Promise<DevtoolsBackend | undefined> | undefined;
let warnedUnregistered = false;

// Session storage can be absent or throw (private modes, sandboxed frames,
// servers) — persistence is best-effort.
const persisted = (write?: boolean, key = PERSIST_KEY) => {
    try {
        const storage = globalThis.sessionStorage;

        if (write !== undefined) {
            write ? storage.setItem(key, '1') : storage.removeItem(key);
        }

        return storage.getItem(key) === '1';
    } catch {
        return false;
    }
};
const hudOpen = (write?: boolean) => persisted(write, HUD_OPEN_KEY);
const host: DevtoolsHost = { hudClosed: () => hudOpen(false) };

/**
 * Starts devtools: loads the registered implementation and activates it.
 * Warns once, and does nothing else, when none is registered.
 * @param options `persist` re-enables on the next load of this tab.
 * @returns The running backend, or `undefined` when none is registered.
 */
export const enableDevtools = ({ persist }: DevtoolsEnableOptions = {}) => {
    if (!loader) {
        warnedUnregistered ||
            loomConsole.warn(
                ...formatDiagnostic({
                    event: 'no devtools implementation is registered',
                    remedy: 'set `devtools` in loom.config or call `registerDevtools`',
                    scope: 'devtools'
                })
            );
        warnedUnregistered = true;

        return Promise.resolve(undefined);
    }

    persist !== undefined && persisted(persist);

    if (!running) {
        const load = loader;

        startBuffering();
        running = load()
            .then((devtoolsModule) => devtoolsModule.activate(host))
            // A failed load leaves the switch off, so a retry loads again.
            .catch((error: unknown) => {
                running = undefined;
                setDevtoolsHook(null);
                throw error;
            });
    }

    return running;
};

/**
 * Stops devtools: removes its hook and page overlays, and clears a
 * persisted enable.
 */
export const disableDevtools = async () => {
    const current = running;

    persisted(false);
    hudOpen(false);
    running = undefined;
    setDevtoolsHook(null);
    (await current)?.deactivate();
};

/**
 * Opens the devtools HUD, starting devtools first when needed.
 * @param placement `dock` or `float`; omitted, where the HUD was last.
 */
export const openDevtools = async (placement?: DevtoolsPlacement) => {
    const backend = await enableDevtools();

    backend && hudOpen(true);
    backend?.open(placement);
};

/**
 * Selects an instance in a running devtools HUD; a no-op while devtools is
 * off.
 * @param ctx The component context to select.
 */
export const selectInDevtools = async (ctx: ComponentContextPartial) =>
    (await running)?.select(ctx);

/**
 * Registers how devtools loads — typically
 * `registerDevtools(() => import('@loom-js/devtools'))`. The loom build
 * tool's `devtools` config key registers it for you. Starts devtools right
 * away when a persisted enable is pending for this tab, and reopens the HUD
 * where it was when it was open at the last load.
 * @param devtoolsLoader Resolves to the devtools module.
 */
export const registerDevtools = (devtoolsLoader: DevtoolsLoader) => {
    loader = devtoolsLoader;
    hudOpen() ? openDevtools() : persisted() && enableDevtools();
};
