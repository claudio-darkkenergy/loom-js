import type { ComponentContextPartial } from '../../types';
import { formatDiagnostic } from '../globals/diagnostic-format';
import { loomConsole } from '../globals/loom-console';
import { setDevtoolsHook, startBuffering } from './hook';

/** Where the devtools HUD opens: docked in the page or in its own window. */
export type DevtoolsPlacement = 'dock' | 'popup';

/** A running devtools implementation, as its module's `activate` returns it. */
export interface DevtoolsBackend {
    deactivate(): void;
    open(placement: DevtoolsPlacement): void;
    select(ctx: ComponentContextPartial): void;
}

/** The module a devtools loader resolves to (`@loom-js/devtools`). */
export interface DevtoolsModule {
    activate(): DevtoolsBackend | Promise<DevtoolsBackend>;
}

export type DevtoolsLoader = () => Promise<DevtoolsModule>;

export interface DevtoolsEnableOptions {
    // Re-enable on the next load of this tab, before the app mounts.
    persist?: boolean;
}

const PERSIST_KEY = 'loom:devtools';
let loader: DevtoolsLoader | undefined;
let running: Promise<DevtoolsBackend | undefined> | undefined;
let warnedUnregistered = false;

// Session storage can be absent or throw (private modes, sandboxed frames,
// servers) — persistence is best-effort.
const persisted = (write?: boolean) => {
    try {
        const storage = globalThis.sessionStorage;

        if (write !== undefined) {
            write
                ? storage.setItem(PERSIST_KEY, '1')
                : storage.removeItem(PERSIST_KEY);
        }

        return storage.getItem(PERSIST_KEY) === '1';
    } catch {
        return false;
    }
};

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
            .then((devtoolsModule) => devtoolsModule.activate())
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
    running = undefined;
    setDevtoolsHook(null);
    (await current)?.deactivate();
};

/**
 * Opens the devtools HUD, starting devtools first when needed.
 * @param placement `dock` (default) or `popup`.
 */
export const openDevtools = async (placement: DevtoolsPlacement = 'dock') =>
    (await enableDevtools())?.open(placement);

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
 * away when a persisted enable is pending for this tab.
 * @param devtoolsLoader Resolves to the devtools module.
 */
export const registerDevtools = (devtoolsLoader: DevtoolsLoader) => {
    loader = devtoolsLoader;
    persisted() && enableDevtools();
};
