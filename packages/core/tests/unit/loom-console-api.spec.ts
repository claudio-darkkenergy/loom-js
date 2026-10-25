import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { LoomGlobal, activity, component } from '../../src';
import {
    DevtoolsBackend,
    DevtoolsHook,
    inspectActivities,
    inspectNode,
    inspectTree,
    isInspectRecord,
    registerDevtools,
    takeBufferedEvents
} from '../../src/devtools';
import { runSetup } from '../support/run-setup';

// Specs for the console-API records devtools installs on `loom` and the
// `loom.devtools` switch: unregistered warning, loading, disable, persisted
// enable and the boot-time event buffer.

const loom = () => (globalThis as unknown as { loom: LoomGlobal }).loom;

const fakeBackend = (): DevtoolsBackend => ({
    deactivate: sinon.spy(),
    open: sinon.spy(),
    select: sinon.spy()
});

describe('loom console API', () => {
    const tag = activity('hello', { label: 'tag' });
    const Badge = component<{ text: string }>(
        (html, { text }) => html`
            <em data-badge>${text}${tag.effect(({ value }) => value)}</em>
        `,
        { name: 'Badge' }
    );
    const Panel = component(
        (html) => html`
            <div data-panel>${Badge({ key: 'b', text: 'hi' })}</div>
        `,
        { name: 'Panel' }
    );

    before(async () => {
        await runSetup({ containerProps: { TestComponent: Panel } });
    });

    afterEach(() => sessionStorage.clear());

    it('leaves the console API to devtools', () => {
        expect(loom()).to.not.have.any.keys('activities', 'inspect', 'tree');
        expect(loom().devtools).to.have.all.keys('disable', 'enable', 'open');
    });

    it('inspects the instance that rendered a node', () => {
        const record = inspectNode(document.querySelector('[data-badge]')!)!;

        expect(record).to.include({
            key: 'b',
            kind: 'component',
            name: 'Badge',
            parent: 'Panel'
        });
        expect(record.props).to.include({ text: 'hi' });
        expect(record.activities.map(({ name }) => name)).to.deep.equal([
            '⟨tag⟩'
        ]);
        expect(isInspectRecord(record)).to.be.true;
    });

    it('returns undefined for a node outside every app', () => {
        expect(inspectNode(document.createElement('p'))).to.be.undefined;
    });

    it('reports every mounted app as a tree', () => {
        const names = (records: { children: any[]; name: string }[]): any[] =>
            records.flatMap(({ children, name }) => [name, ...names(children)]);

        expect(names(inspectTree())).to.include.members([
            'Panel',
            'Badge',
            '⟨tag⟩'
        ]);
    });

    it('lists the activities driving the page', () => {
        const record = inspectActivities().find(({ name }) => name === '⟨tag⟩');

        expect(record).to.include({ pending: false, value: 'hello' });
        expect(record!.activity).to.equal(tag);
    });

    describe('devtools switch', () => {
        it('warns once and does nothing when no devtools is registered', async () => {
            const warn = sinon.stub(console, 'warn');

            try {
                expect(await loom().devtools.enable()).to.be.undefined;
                await loom().devtools.enable();
                expect(warn.callCount).to.equal(1);
                expect(String(warn.firstCall.args[0])).to.include(
                    'no devtools implementation is registered'
                );
            } finally {
                warn.restore();
            }
        });

        it('loads, opens, selects and disables a registered backend', async () => {
            const backend = fakeBackend();
            const loader = sinon.spy(async () => ({ activate: () => backend }));

            registerDevtools(loader);
            await loom().devtools.open('popup');
            inspectNode(document.querySelector('[data-badge]')!);
            await Promise.resolve();

            expect(loader.callCount).to.equal(1);
            expect((backend.open as sinon.SinonSpy).calledWith('popup')).to.be
                .true;
            expect((backend.select as sinon.SinonSpy).callCount).to.equal(1);

            await loom().devtools.disable();
            expect((backend.deactivate as sinon.SinonSpy).callCount).to.equal(
                1
            );
        });

        it('persists an enable and restarts on the next registration', async () => {
            const firstLoader = sinon.spy(async () => ({
                activate: fakeBackend
            }));

            registerDevtools(firstLoader);
            await loom().devtools.enable({ persist: true });
            expect(sessionStorage.getItem('loom:devtools')).to.equal('1');

            // A reload: the switch resets, the loader registers again.
            await loom().devtools.disable();
            sessionStorage.setItem('loom:devtools', '1');

            const nextLoader = sinon.spy(async () => ({
                activate: fakeBackend
            }));

            registerDevtools(nextLoader);
            expect(nextLoader.callCount, 'started on registration').to.equal(1);
            await loom().devtools.disable();
            expect(sessionStorage.getItem('loom:devtools')).to.be.null;
        });

        it('buffers renders until the backend takes them', async () => {
            let resolveLoad!: () => void;
            const loaded = new Promise<void>(
                (resolve) => (resolveLoad = resolve)
            );
            const hook: DevtoolsHook = {
                activityCreated: sinon.spy(),
                rendered: sinon.spy()
            };

            registerDevtools(async () => {
                await loaded;

                return {
                    activate: () => {
                        takeBufferedEvents(hook);

                        return fakeBackend();
                    }
                };
            });

            const enabling = loom().devtools.enable();

            tag.update('buffered');
            resolveLoad();
            await enabling;

            expect((hook.rendered as sinon.SinonSpy).called).to.be.true;
            await loom().devtools.disable();
        });
    });
});
