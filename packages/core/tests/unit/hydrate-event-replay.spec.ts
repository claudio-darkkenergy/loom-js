import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component, hydrate, lazyImport } from '../../src';
import type { Component } from '../../src/types';

const macrotasks = async (count: number) => {
    for (let elapsed = 0; elapsed < count; elapsed++) {
        await new Promise((resolve) => setTimeout(resolve));
    }
};

const Shell = component(
    (html) => html`
        <em class="fallback">loading</em>
    `
);

// An app whose page sits behind a caller-released lazy import — the swap is
// held open so the tests can interact with the served markup mid-settle.
const makeGatedApp = (
    Page: Component,
    releaseRef: { release?: () => void }
) => {
    const importActivity = lazyImport<Component>(
        Symbol('replay-page'),
        () =>
            new Promise((resolve) => {
                releaseRef.release = () => resolve(Page);
            })
    );

    return component(
        (html) => html`
            <div class="app">
                ${importActivity.effect(({ value }) =>
                    value ? (value as Component)() : Shell()
                )}
            </div>
        `
    );
};

describe('hydrate event replay', () => {
    // A test-owned safety net over native default actions (form submission,
    // anchor navigation): records whether the framework already prevented
    // the event, then prevents it so the test page never navigates.
    const preventedOnArrival: Record<string, boolean[]> = {};
    const safetyNet = (event: Event) => {
        (preventedOnArrival[event.type] ??= []).push(event.defaultPrevented);
        event.preventDefault();
    };
    // Per-test teardown (root removal, gate releases) registered up front so
    // a failing assertion can never leave a wedged settle counter — a pinned
    // count would hang every later `settled()` await.
    const cleanups: Array<() => void> = [];

    beforeEach(() => {
        document.addEventListener('click', safetyNet);
        document.addEventListener('submit', safetyNet);
    });

    afterEach(() => {
        while (cleanups.length) {
            cleanups.pop()?.();
        }

        document.removeEventListener('click', safetyNet);
        document.removeEventListener('submit', safetyNet);

        for (const eventType of Object.keys(preventedOnArrival)) {
            delete preventedOnArrival[eventType];
        }

        sinon.restore();
    });

    it('should honor an early click exactly once: swap, sweep, replay, then onAppMounted', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><button class="go">Go</button></div>';
        document.body.append(root);
        cleanups.push(() => root.remove());

        const log: string[] = [];
        let releaseReady!: () => void;
        const ready = new Promise<void>((resolve) => (releaseReady = resolve));

        cleanups.push(() => releaseReady());
        const App = component((html, { onMounted }) => {
            onMounted(() => log.push('mounted'));

            return html`
                <div class="app">
                    <button class="go" $click=${() => log.push('click')}>
                        Go
                    </button>
                </div>
            `;
        });
        const bootDone = hydrate({
            app: App(),
            onAppMounted: () => log.push('appMounted'),
            ready,
            replayEvents: true,
            root
        });

        await macrotasks(2);
        root.querySelector<HTMLButtonElement>('.go')?.click();
        await macrotasks(2);

        // Nothing fires against the inert served markup.
        expect(log).to.deep.equal([]);

        releaseReady();
        await bootDone;

        // The replay lands after the lifecycle sweep and before the
        // app-mounted callback — and lands exactly once.
        expect(log).to.deep.equal(['mounted', 'click', 'appMounted']);
    });

    it('should prevent an early submit and replay it against the client form', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><form class="search"><input name="q" /></form></div>';
        document.body.append(root);
        cleanups.push(() => root.remove());

        const submitLog: Event[] = [];
        let releaseReady!: () => void;
        const ready = new Promise<void>((resolve) => (releaseReady = resolve));

        cleanups.push(() => releaseReady());
        const App = component(
            (html) => html`
                <div class="app">
                    <form
                        class="search"
                        $submit=${(event: Event) => {
                            event.preventDefault();
                            submitLog.push(event);
                        }}
                    >
                        <input name="q" />
                    </form>
                </div>
            `
        );
        const bootDone = hydrate({
            app: App(),
            ready,
            replayEvents: true,
            root
        });

        await macrotasks(2);
        root.querySelector<HTMLFormElement>('.search')?.requestSubmit();
        await macrotasks(2);
        expect(submitLog.length).to.equal(0);

        // The framework — not the test's safety net — cancelled the native
        // form submission (a full-page post is the exact loss being solved).
        expect(preventedOnArrival.submit?.[0]).to.equal(true);

        releaseReady();
        await bootDone;

        expect(submitLog.length).to.equal(1);
    });

    it('should leave anchor clicks to native navigation: neither prevented nor replayed', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><a class="away" href="#elsewhere">Away</a></div>';
        document.body.append(root);
        cleanups.push(() => root.remove());

        const clickLog: Event[] = [];
        let releaseReady!: () => void;
        const ready = new Promise<void>((resolve) => (releaseReady = resolve));

        cleanups.push(() => releaseReady());
        const App = component(
            (html) => html`
                <div class="app">
                    <a
                        class="away"
                        href="#elsewhere"
                        $click=${(event: Event) => clickLog.push(event)}
                    >
                        Away
                    </a>
                </div>
            `
        );
        const bootDone = hydrate({
            app: App(),
            ready,
            replayEvents: true,
            root
        });

        await macrotasks(2);
        root.querySelector<HTMLAnchorElement>('.away')?.click();
        await macrotasks(2);

        // Graceful degradation outranks replay: the click reached the
        // browser unprevented.
        expect(preventedOnArrival.click?.[0]).to.equal(false);

        releaseReady();
        await bootDone;

        // …and is not re-dispatched: the client handler never fires, and the
        // document saw exactly the one native click.
        expect(clickLog.length).to.equal(0);
        expect(preventedOnArrival.click?.length).to.equal(1);
    });

    it('should drop an unresolvable target with a warning naming the event and path', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><section><button class="deep">Go</button></section></div>';
        document.body.append(root);
        cleanups.push(() => root.remove());

        const warnStub = sinon.stub(globalThis.console, 'warn');
        // Never released before the bound expires — the swap lands the
        // shell, whose tree cannot resolve the served button's path.
        const releaseRef: { release?: () => void } = {};

        // Drain the wedged import at teardown so the window's counter
        // returns to zero.
        cleanups.push(() => releaseRef.release?.());

        const Page = component(
            (html) => html`
                <section><button class="deep">Go</button></section>
            `
        );
        const App = makeGatedApp(Page, releaseRef);
        const bootDone = hydrate({
            app: App(),
            maxWait: 50,
            replayEvents: true,
            root
        });

        await macrotasks(2);
        root.querySelector<HTMLButtonElement>('.deep')?.click();
        await bootDone;

        const replayWarning = warnStub
            .getCalls()
            .map((call) => call.args.join(' '))
            .find((message) => /replay/i.test(message));

        // Dropped loudly — the warning names the event type and the path
        // that failed to resolve — and never mis-delivered.
        expect(replayWarning).to.contain('click');
        expect(replayWarning).to.match(/0.*0.*0/);
    });

    it('should replay mixed event types in FIFO order', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><button class="first">First</button><form class="mid"><input name="q" /></form><button class="last">Last</button></div>';
        document.body.append(root);
        cleanups.push(() => root.remove());

        const log: string[] = [];
        let releaseReady!: () => void;
        const ready = new Promise<void>((resolve) => (releaseReady = resolve));

        cleanups.push(() => releaseReady());
        const App = component(
            (html) => html`
                <div class="app">
                    <button class="first" $click=${() => log.push('first')}>
                        First
                    </button>
                    <form
                        class="mid"
                        $submit=${(event: Event) => {
                            event.preventDefault();
                            log.push('submit');
                        }}
                    >
                        <input name="q" />
                    </form>
                    <button class="last" $click=${() => log.push('last')}>
                        Last
                    </button>
                </div>
            `
        );
        const bootDone = hydrate({
            app: App(),
            ready,
            replayEvents: true,
            root
        });

        await macrotasks(2);
        root.querySelector<HTMLButtonElement>('.first')?.click();
        root.querySelector<HTMLFormElement>('.mid')?.requestSubmit();
        root.querySelector<HTMLButtonElement>('.last')?.click();
        await macrotasks(2);

        releaseReady();
        await bootDone;

        expect(log).to.deep.equal(['first', 'submit', 'last']);
    });

    it('should attach no capture listeners when replayEvents is off', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><button class="go">Go</button></div>';
        document.body.append(root);
        cleanups.push(() => root.remove());

        const addListenerSpy = sinon.spy(root, 'addEventListener');
        const App = component(
            (html) => html`
                <div class="app"><button class="go">Go</button></div>
            `
        );

        await hydrate({ app: App(), root });

        expect(addListenerSpy.called).to.be.false;
    });

    it('should dispatch replays as untrusted events (isTrusted false)', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><button class="go">Go</button></div>';
        document.body.append(root);
        cleanups.push(() => root.remove());

        const trustLog: boolean[] = [];
        let releaseReady!: () => void;
        const ready = new Promise<void>((resolve) => (releaseReady = resolve));

        cleanups.push(() => releaseReady());
        const App = component(
            (html) => html`
                <div class="app">
                    <button
                        class="go"
                        $click=${(event: Event) => trustLog.push(event.isTrusted)}
                    >
                        Go
                    </button>
                </div>
            `
        );
        const bootDone = hydrate({
            app: App(),
            ready,
            replayEvents: true,
            root
        });

        await macrotasks(2);
        root.querySelector<HTMLButtonElement>('.go')?.click();
        await macrotasks(2);

        releaseReady();
        await bootDone;

        expect(trustLog).to.deep.equal([false]);
    });
});
