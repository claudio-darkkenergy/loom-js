import { expect } from '@esm-bundle/chai';
import { activity, component, init } from '@loom-js/core';
import type { DevtoolsBackend } from '@loom-js/core/devtools';
import sinon from 'sinon';

import { createBackend } from '../src/backend';
import { HUD_ROOT_ID } from '../src/backend/hosts';

// Specs for `devtools-inspector`'s HUD, driving the real prebuilt frontend:
// docked in a frame and popped out to a window, isolated from the app,
// showing the live tree, and editing activities.

const count = activity(1, { label: 'count' });
const Counter = component(
    (html) => html`
        <div data-counter>
            <button data-app-button type="button">app button</button>
            <span data-count>${count.effect(({ value }) => value)}</span>
        </div>
    `,
    { name: 'Counter' }
);

const waitFor = async <T>(
    read: () => T | undefined | null | false,
    timeout = 4000
) => {
    const started = Date.now();

    for (;;) {
        const value = read();

        if (value) {
            return value;
        }

        if (Date.now() - started > timeout) {
            throw new Error('timed out');
        }

        await new Promise((resolve) => setTimeout(resolve, 25));
    }
};

const dockFrame = () =>
    document.querySelector<HTMLIFrameElement>('iframe[title="loom devtools"]');
const hudText = (doc: Document | null | undefined) =>
    doc?.getElementById(HUD_ROOT_ID)?.textContent ?? '';

describe('devtools HUD', () => {
    let backend: DevtoolsBackend;

    before(() => {
        const style = document.createElement('style');
        const root = document.createElement('div');

        style.textContent = 'button { color: rgb(255, 0, 0); }';
        document.head.append(style);
        document.body.append(root);
        init({ app: Counter(), root });
        backend = createBackend(window);
    });

    after(() => backend.deactivate());

    it('docks in a frame that shows the live tree', async () => {
        backend.open('dock');

        const frame = await waitFor(dockFrame);

        await waitFor(() => hudText(frame.contentDocument).includes('Counter'));
        expect(hudText(frame.contentDocument)).to.include('connected');
    });

    it('keeps the HUD out of the app tree and styles apart', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const hudButton = frameDoc.querySelector('button')!;
        const appButton = document.querySelector('[data-app-button]')!;
        const tree = (
            globalThis as unknown as { loom: { tree(): { name: string }[] } }
        ).loom.tree();

        expect(tree.map(({ name }) => name)).to.not.include('Hud');
        expect(
            frameDoc.defaultView!.getComputedStyle(hudButton).color
        ).to.not.equal('rgb(255, 0, 0)');
        expect(getComputedStyle(appButton).color).to.equal('rgb(255, 0, 0)');
    });

    it('selects a tree row into the inspector and counts renders', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const row = Array.from(frameDoc.querySelectorAll('.tree-row')).find(
            (candidate) => candidate.textContent?.includes('Counter')
        ) as HTMLElement;

        row.click();
        await waitFor(() =>
            frameDoc
                .querySelector('.details-name')
                ?.textContent?.includes('Counter')
        );
        expect(
            frameDoc.querySelector('.inspector-pane')!.textContent
        ).to.include('⟨count⟩');

        count.update(2);
        await waitFor(() =>
            Array.from(frameDoc.querySelectorAll('.tree-row')).some(
                (candidate) => candidate.textContent?.includes('×1')
            )
        );
    });

    it('edits an activity from the activities tab', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const tab = Array.from(frameDoc.querySelectorAll('button')).find(
            (button) => button.textContent?.trim() === 'Activities'
        )!;

        tab.click();

        const form = await waitFor(() =>
            Array.from(frameDoc.querySelectorAll('.activity-item'))
                .find((item) => item.textContent?.includes('⟨count⟩'))
                ?.querySelector('form')
        );
        const input = form.querySelector('input')!;

        input.value = '42';
        form.requestSubmit();

        await waitFor(
            () => document.querySelector('[data-count]')!.textContent === '42'
        );
    });

    it('pops out to a window and closes the dock', async () => {
        backend.open('popup');

        const popup = await waitFor(() => window.open('', 'loom-devtools'));

        await waitFor(() => hudText(popup.document).includes('Counter'));
        expect(dockFrame()).to.be.null;
        popup.close();
    });

    it('falls back to the dock when the popup is blocked', async () => {
        const open = sinon.stub(window, 'open').returns(null);
        const info = sinon.stub(console, 'info');

        try {
            backend.open('popup');
            expect(dockFrame()).to.exist;
            expect(String(info.firstCall.args[0])).to.include(
                'blocked the popup'
            );
        } finally {
            open.restore();
            info.restore();
        }
    });

    it('never writes into a foreign window that holds the popup name', async () => {
        const otherHost =
            location.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
        const foreign = window.open(
            `${location.protocol}//${otherHost}:${location.port}/`,
            'loom-devtools'
        )!;
        const info = sinon.stub(console, 'info');

        // A fresh backend, so the dock the earlier tests opened is gone.
        backend.deactivate();
        backend = createBackend(window);

        try {
            // Navigation commits asynchronously; wait until it is cross-origin.
            await waitFor(() => {
                try {
                    return !foreign.document;
                } catch {
                    return true;
                }
            });
            expect(() => backend.open('popup')).not.to.throw();
            expect(dockFrame()).to.exist;
            expect(String(info.firstCall.args[0])).to.include(
                'could not open the popup'
            );
        } finally {
            info.restore();
            foreign.close();
        }
    });
});
