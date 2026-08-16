import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { activity, component, hydrate, lazyImport, setDebug } from '../../src';
import type { Component } from '../../src/types';

const macrotasks = async (count: number) => {
    for (let elapsed = 0; elapsed < count; elapsed++) {
        await new Promise((resolve) => setTimeout(resolve));
    }
};

const HydratedPage = component(
    (html) => html`
        <p class="page">Client page</p>
    `
);
const Shell = component(
    (html) => html`
        <em class="fallback">loading</em>
    `
);

// An app whose page content sits behind a caller-gated lazy import — the
// hydrating boot must hold the swap until the import lands.
const makeLazyApp = (releaseRef: { release?: () => void }) => {
    const importActivity = lazyImport<Component>(
        Symbol('hydrate-page'),
        () =>
            new Promise((resolve) => {
                releaseRef.release = () => resolve(HydratedPage);
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

describe('hydrate', () => {
    afterEach(() => {
        sinon.restore();
        setDebug(false);
    });

    it('should leave pre-rendered children untouched until a single settled swap', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><p class="page">Server page</p></div>';
        document.body.append(root);

        const serverMarkup = root.innerHTML;
        const mutationBatches: MutationRecord[][] = [];
        const rootObserver = new MutationObserver((records) =>
            mutationBatches.push(records)
        );

        rootObserver.observe(root, { childList: true, subtree: true });

        const releaseRef: { release?: () => void } = {};
        const App = makeLazyApp(releaseRef);
        const bootDone = hydrate({ app: App(), root });

        // Ample macrotasks — the pre-rendered DOM must stay visible while the
        // import is pending.
        await macrotasks(5);
        expect(root.innerHTML).to.equal(serverMarkup);

        releaseRef.release?.();
        await bootDone;

        // The settled page — never the shell/fallback — is what swapped in.
        expect(root.querySelector('.page')?.textContent).to.equal(
            'Client page'
        );
        expect(root.querySelector('.fallback')).to.equal(null);

        // Exactly one childList mutation on the root itself — a single
        // replaceChildren-equivalent swap, no intermediate attach.
        const rootChildListRecords = [
            ...mutationBatches.flat(),
            ...rootObserver.takeRecords()
        ].filter((record) => record.target === root);

        rootObserver.disconnect();
        expect(rootChildListRecords.length).to.equal(1);
        root.remove();
    });

    it('should hold the swap for a caller-supplied ready gate after settlement', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><p class="page">Server page</p></div>';
        document.body.append(root);

        const serverMarkup = root.innerHTML;
        let releaseReady!: () => void;
        const ready = new Promise<void>((resolve) => (releaseReady = resolve));
        // A synchronous app — settled resolves right away, so only `ready`
        // holds the swap.
        const App = component(
            (html) => html`
                <div class="app"><p class="page">Client page</p></div>
            `
        );
        const bootDone = hydrate({ app: App(), root, ready });

        await macrotasks(5);
        expect(root.innerHTML).to.equal(serverMarkup);

        releaseReady();
        await bootDone;
        expect(root.querySelector('.page')?.textContent).to.equal(
            'Client page'
        );
        root.remove();
    });

    it('should swap anyway when maxWait expires, warning with the pending count', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><p class="page">Server page</p></div>';
        document.body.append(root);

        // `loomConsole` resolves the underlying console method at call time,
        // so stubbing `console.warn` intercepts the framework warning.
        const warnStub = sinon.stub(globalThis.console, 'warn');
        // Not released until after the bound expires — settlement cannot
        // complete in time.
        const releaseRef: { release?: () => void } = {};
        const App = makeLazyApp(releaseRef);

        await hydrate({
            app: App(),
            globalConfig: { debug: true },
            maxWait: 50,
            root
        });

        // The swap ran with the app's current rendered state — the shell.
        expect(root.querySelector('.fallback')).to.not.equal(null);
        expect(warnStub.calledOnce).to.be.true;

        const warning = warnStub.firstCall.args.join(' ');

        expect(warning).to.match(/settle/i);
        expect(warning).to.contain('1');

        // Drain the wedged import so the window's counter returns to zero —
        // a pinned count would hang every later `settled()` await.
        releaseRef.release?.();
        root.remove();
    });

    it('should wait for genuine settlement without warning when maxWait is Infinity', async () => {
        const root = document.createElement('div');

        root.innerHTML =
            '<div class="app"><p class="page">Server page</p></div>';
        document.body.append(root);

        const serverMarkup = root.innerHTML;
        const warnStub = sinon.stub(globalThis.console, 'warn');
        const releaseRef: { release?: () => void } = {};
        const App = makeLazyApp(releaseRef);
        const bootDone = hydrate({
            app: App(),
            globalConfig: { debug: true },
            maxWait: Infinity,
            root
        });

        await macrotasks(3);
        expect(root.innerHTML).to.equal(serverMarkup);

        releaseRef.release?.();
        await bootDone;
        expect(root.querySelector('.page')?.textContent).to.equal(
            'Client page'
        );
        expect(warnStub.called).to.be.false;
        root.remove();
    });

    it('should degrade gracefully on an empty root through the same deferred path', async () => {
        const root = document.createElement('div');

        document.body.append(root);

        const releaseRef: { release?: () => void } = {};
        const App = makeLazyApp(releaseRef);
        const bootDone = hydrate({ app: App(), root });

        // No pre-rendered markup — the root simply stays empty until the swap.
        await macrotasks(3);
        expect(root.childNodes.length).to.equal(0);

        releaseRef.release?.();
        await bootDone;
        expect(root.querySelector('.page')?.textContent).to.equal(
            'Client page'
        );
        expect(root.querySelector('.fallback')).to.equal(null);
        root.remove();
    });

    it('should fire onCreated/onRendered off-DOM, onMounted at the swap, onAppMounted after', async () => {
        const root = document.createElement('div');

        root.innerHTML = '<p class="page">Server page</p>';
        document.body.append(root);

        const lifecycleLog: string[] = [];
        const attachment = (node: unknown) =>
            node instanceof Node && document.contains(node)
                ? 'attached'
                : 'detached';
        const TrackedPage = component(
            (html, { onCreated, onMounted, onRendered }) => {
                onCreated((node) =>
                    lifecycleLog.push(`created:${attachment(node)}`)
                );
                onRendered((node) =>
                    lifecycleLog.push(`rendered:${attachment(node)}`)
                );
                onMounted((node) =>
                    lifecycleLog.push(`mounted:${attachment(node)}`)
                );

                return html`
                    <p class="page">Client page</p>
                `;
            }
        );

        await hydrate({
            app: TrackedPage(),
            onAppMounted: () => lifecycleLog.push('appMounted'),
            root
        });

        expect(lifecycleLog).to.deep.equal([
            'created:detached',
            'rendered:detached',
            'mounted:attached',
            'appMounted'
        ]);
        root.remove();
    });

    it('should apply a pre-swap effect update without lifecycle double-fires', async () => {
        const root = document.createElement('div');

        root.innerHTML = '<div class="app"><p class="content">first</p></div>';
        document.body.append(root);

        const hookCounts = { created: 0, mounted: 0 };
        const contentActivity = activity<string>('first');
        const CountedContent = component<{ value: string }>(
            (html, { onCreated, onMounted, value }) => {
                onCreated(() => hookCounts.created++);
                onMounted(() => hookCounts.mounted++);

                return html`
                    <p class="content">${value}</p>
                `;
            }
        );
        const App = component(
            (html) => html`
                <div class="app">
                    ${contentActivity.effect(({ value }) =>
                        CountedContent({ value })
                    )}
                </div>
            `
        );
        let releaseReady!: () => void;
        const ready = new Promise<void>((resolve) => (releaseReady = resolve));
        const bootDone = hydrate({ app: App(), ready, root });

        // Land an effect update while the tree is still detached — the
        // D7 exposure: the detached root fails the instance-freshness
        // containment check.
        await macrotasks(2);
        contentActivity.update('second');
        await macrotasks(2);

        releaseReady();
        await bootDone;

        expect(root.querySelector('.content')?.textContent).to.equal('second');
        expect(hookCounts.created).to.equal(1);
        expect(hookCounts.mounted).to.equal(1);
        root.remove();
    });
});
