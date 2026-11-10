import { expect } from '@esm-bundle/chai';
import { activity, component, init } from '@loom-js/core';
import { type DevtoolsBackend, findOwnerContext } from '@loom-js/core/devtools';
import sinon from 'sinon';

import { createBackend } from '../src/backend';
import { COLLAPSED_SIZE } from '../src/backend/dock-state';
import { GRIP_SIZE, HUD_ROOT_ID } from '../src/backend/hosts';
import { LOGO_CIRCLES } from '../src/logo';
import { createTransport } from '../src/protocol/transport';

// Specs for `devtools-inspector`'s HUD, driving the real prebuilt frontend:
// docked or popped out, isolated from the app, its tree, activities and
// links, in-place editing, and the dock's space, size, collapse and modals.

const count = activity(1, { label: 'count' });
const Leaf = component(
    (html) => html`
        <em data-leaf>leaf</em>
    `,
    { name: 'Leaf' }
);
// Two keyed instances binding one activity.
const tone = activity('calm', { label: 'tone' });
const Swatch = component(
    (html) => html`
        <i data-tone=${tone.bind()}>swatch</i>
    `,
    { name: 'Swatch' }
);
// Renders the component it receives as `children`.
const Branch = component(
    (html, { children }) => html`
        <p data-branch>${children}</p>
    `,
    { name: 'Branch' }
);
const Counter = component(
    (html, { own }) => {
        const note = own(() => activity('hi', { label: 'note' }));

        return html`
            <div data-counter>
                <button data-app-button type="button">app button</button>
                <span data-count>${count.effect(({ value }) => value)}</span>
                <span data-note>${note.effect(({ value }) => value)}</span>
                ${Branch({ children: Leaf() })}
                ${['a', 'b'].map((key) => Swatch({ key }))}
            </div>
        `;
    },
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
const rowNamed = (doc: Document, name: string) =>
    Array.from(doc.querySelectorAll<HTMLElement>('.tree-row')).find(
        (row) => row.querySelector('.tree-name')?.textContent?.trim() === name
    );
// By visible text, or by accessible name for an icon button.
const buttonNamed = (root: ParentNode, text: string) =>
    Array.from(root.querySelectorAll('button')).find(
        (button) =>
            button.textContent?.trim() === text ||
            button.getAttribute('aria-label') === text
    )!;
const activityItem = (doc: Document, name: string) =>
    Array.from(doc.querySelectorAll<HTMLElement>('.activity-item')).find(
        (item) => item.querySelector('.activity-name')?.textContent === name
    );
// Opens an activity value's in-place editor (once a previous edit has
// closed) and types into it.
const editValue = async (item: HTMLElement, text: string) => {
    const preview = await waitFor(() =>
        item.querySelector<HTMLElement>('.value-preview.is-editable')
    );

    preview.click();

    const input = await waitFor(() => item.querySelector('input'));

    input.value = text;
    return input;
};
// The floating window's drag bar, corner handle and minimized button.
const grip = () =>
    document.querySelector<HTMLElement>('[title="Drag to move devtools"]');
const floatEdge = (edge: string) =>
    document.querySelector<HTMLElement>(`[data-edge="${edge}"]`);
const bubble = () =>
    document.querySelector<HTMLElement>('[aria-label="Expand devtools"]');
// The floating window's rect, read from its frame under the drag bar.
const floatState = () => {
    const frame = dockFrame()!.getBoundingClientRect();

    return {
        float: {
            height: frame.height + GRIP_SIZE,
            width: frame.width,
            x: frame.left,
            y: frame.top - GRIP_SIZE
        },
        floating: JSON.parse(localStorage.getItem('loom-devtools:dock')!)
            .floating as boolean
    };
};
// Presses `element`, moves by (dx, dy) and releases.
const drag = (element: HTMLElement, dx: number, dy: number) => {
    const { left, top } = element.getBoundingClientRect();
    const at = (type: string, x: number, y: number) =>
        element.dispatchEvent(
            new PointerEvent(type, {
                bubbles: true,
                clientX: x,
                clientY: y,
                pointerId: 1
            })
        );

    at('pointerdown', left + 2, top + 2);
    (dx || dy) && at('pointermove', left + 2 + dx, top + 2 + dy);
    at('pointerup', left + 2 + dx, top + 2 + dy);
};
// Picks a dock position from the HUD's position buttons.
const chooseDock = (doc: Document, position: string) =>
    doc
        .querySelector<HTMLButtonElement>(
            `[aria-label="Dock position"] button[value="${position}"]`
        )!
        .click();
const press = (input: HTMLInputElement, key: string) =>
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));

describe('devtools HUD', () => {
    let backend: DevtoolsBackend;

    before(() => {
        localStorage.removeItem('loom-devtools:dock');
        localStorage.removeItem('loom-devtools:hud');

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

    it('shows the loom logo in the toolbar', () => {
        const circles = Array.from(
            dockFrame()!.contentDocument!.querySelectorAll('.hud-logo circle')
        ).map((circle) =>
            ['cx', 'cy', 'r', 'fill'].map((name) => circle.getAttribute(name))
        );

        expect(circles).to.deep.equal(
            LOGO_CIRCLES.map((circle) => circle.map(String))
        );
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

    it('reserves the dock height past the page and offers a resize handle', () => {
        const scroller = document.scrollingElement!;

        expect(scroller.scrollHeight - scroller.clientHeight).to.be.at.least(
            dockFrame()!.getBoundingClientRect().height - 1
        );
        expect(document.querySelector('[title="Drag to resize devtools"]')).to
            .exist;
    });

    it('selects a tree row into the inspector and counts re-renders', async () => {
        const frameDoc = dockFrame()!.contentDocument!;

        rowNamed(frameDoc, 'Counter')!.click();
        await waitFor(() =>
            frameDoc
                .querySelector('.details-name')
                ?.textContent?.includes('Counter')
        );
        expect(
            frameDoc.querySelector('.inspector-pane')!.textContent
        ).to.include('⟨count⟩');

        count.update(2);

        const badge = await waitFor(() =>
            Array.from(frameDoc.querySelectorAll('.hud-badge')).find(
                (candidate) => candidate.textContent?.includes('↻ 1')
            )
        );

        expect(badge.getAttribute('title')).to.equal(
            're-rendered 1× since devtools connected'
        );
    });

    it('resets re-render counts', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const badges = () =>
            Array.from(frameDoc.querySelectorAll('.hud-badge')).filter(
                (badge) => badge.textContent?.includes('↻')
            );

        buttonNamed(frameDoc, 'Reset ↻').click();
        await waitFor(() => badges().length === 0);
        count.update(3);
        await waitFor(() => badges().length > 0);
    });

    it('edits an activity in place from the inspector', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const item = await waitFor(() => activityItem(frameDoc, '⟨count⟩'));
        const input = await editValue(item, '42');

        press(input, 'Enter');
        await waitFor(
            () => document.querySelector('[data-count]')!.textContent === '42'
        );
    });

    it('cancels an in-place edit with Escape', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const item = activityItem(frameDoc, '⟨count⟩')!;
        const input = await editValue(item, '7');

        press(input, 'Escape');
        await waitFor(() => !item.querySelector('input'));
        expect(document.querySelector('[data-count]')!.textContent).to.equal(
            '42'
        );
    });

    it('keeps an invalid edit open with the error inline', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const item = activityItem(frameDoc, '⟨count⟩')!;

        press(await editValue(item, '{nope'), 'Enter');

        const error = await waitFor(() => item.querySelector('.edit-error'));

        expect(error.textContent).to.include('Not JSON');
        expect(item.querySelector('input')!.value).to.equal('{nope');
        press(item.querySelector('input')!, 'Escape');
        await waitFor(() => !item.querySelector('input'));
    });

    it("shows an owned activity's scope and selects its owner", async () => {
        const frameDoc = dockFrame()!.contentDocument!;

        buttonNamed(frameDoc, 'Activities').click();

        const note = await waitFor(() => activityItem(frameDoc, '⟨note⟩'));

        expect(activityItem(frameDoc, '⟨count⟩')!.textContent).to.include(
            'no owner'
        );
        expect(note.textContent).to.include('owned by');
        note.querySelector<HTMLElement>('.owner-link')!.click();
        await waitFor(() =>
            frameDoc
                .querySelector('.details-name')
                ?.textContent?.includes('Counter')
        );
    });

    it('edits an activity in place from the activities tab', async () => {
        const frameDoc = dockFrame()!.contentDocument!;

        buttonNamed(frameDoc, 'Activities').click();

        const item = await waitFor(() => activityItem(frameDoc, '⟨count⟩'));

        press(await editValue(item, '5'), 'Enter');
        await waitFor(
            () => document.querySelector('[data-count]')!.textContent === '5'
        );
    });

    it('says where Perf tracks records while it is on', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const hint = () => frameDoc.querySelector('.hud-hint')?.textContent;

        buttonNamed(frameDoc, 'Perf tracks').click();
        await waitFor(() => hint()?.includes('DevTools › Performance'));
        buttonNamed(frameDoc, 'Perf tracks').click();
        await waitFor(() => !hint());
    });

    it('selects the instance a component prop rendered, outlining it on hover', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const highlight = sinon.spy();
        const stop = createTransport(window).listen(
            (source) => source === dockFrame()!.contentWindow,
            (message) =>
                message.type === 'highlight' && highlight(message.payload)
        );

        try {
            buttonNamed(frameDoc, 'Components').click();
            (await waitFor(() => rowNamed(frameDoc, 'Branch')))!.click();
            (
                await waitFor(() =>
                    frameDoc.querySelector<HTMLElement>(
                        '.details-section .value-toggle'
                    )
                )
            ).click();

            const link = await waitFor(() =>
                Array.from(
                    frameDoc.querySelectorAll<HTMLElement>(
                        '.value-preview.is-link'
                    )
                ).find((preview) => preview.textContent?.trim() === '<Leaf />')
            );

            link.dispatchEvent(new MouseEvent('mouseenter'));
            await waitFor(() => highlight.callCount > 0);
            expect(highlight.firstCall.args[0].id).to.be.a('number');
            link.click();
            await waitFor(() =>
                frameDoc
                    .querySelector('.details-name')
                    ?.textContent?.includes('Leaf')
            );
        } finally {
            stop();
        }
    });

    it('reveals a picked instance under a collapsed ancestor, centered in the tree', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const pageScroll = sinon.spy(Element.prototype, 'scrollIntoView');

        buttonNamed(frameDoc, 'Components').click();

        const pane = frameDoc.querySelector<HTMLElement>('.tree-pane')!;
        const branch = await waitFor(() => rowNamed(frameDoc, 'Branch'));

        // Short enough to scroll, so centering shows.
        pane.style.height = '30px';
        branch.querySelector<HTMLElement>('.tree-toggle')!.click();
        await waitFor(() => !rowNamed(frameDoc, 'Leaf'));
        backend.select(
            findOwnerContext(document.querySelector('[data-leaf]')!)!
        );

        const leaf = await waitFor(() => rowNamed(frameDoc, 'Leaf'));

        try {
            await waitFor(() => leaf.classList.contains('is-selected'));
            await waitFor(() => pane.scrollTop > 0);

            const paneRect = pane.getBoundingClientRect();
            const rowRect = leaf.getBoundingClientRect();

            // Centered, or as near as the pane's scroll range allows.
            expect(rowRect.top >= paneRect.top - 1).to.be.true;
            expect(rowRect.bottom <= paneRect.bottom + 1).to.be.true;
            expect(pageScroll.called).to.be.false;
        } finally {
            pageScroll.restore();
            pane.style.height = '';
        }
    });

    it('reveals a picked row that is already shown, every time', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const pane = frameDoc.querySelector<HTMLElement>('.tree-pane')!;
        const leafCtx = findOwnerContext(
            document.querySelector('[data-leaf]')!
        )!;
        const counterCtx = findOwnerContext(
            document.querySelector('[data-counter]')!
        )!;

        pane.style.height = '30px';

        try {
            for (const ctx of [leafCtx, counterCtx, leafCtx]) {
                const name = ctx === leafCtx ? 'Leaf' : 'Counter';

                pane.scrollTop = ctx === leafCtx ? 0 : pane.scrollHeight;
                backend.select(ctx);
                await waitFor(() => {
                    const row = rowNamed(frameDoc, name);
                    const rowRect = row?.getBoundingClientRect();
                    const paneRect = pane.getBoundingClientRect();

                    return (
                        row?.classList.contains('is-selected') &&
                        rowRect!.top >= paneRect.top - 1 &&
                        rowRect!.bottom <= paneRect.bottom + 1
                    );
                });
            }
        } finally {
            pane.style.height = '';
        }
    });

    it('disables Scroll to while the selection is in view', async () => {
        const frameDoc = dockFrame()!.contentDocument!;

        rowNamed(frameDoc, 'Counter')!.click();

        const scrollTo = await waitFor(() =>
            buttonNamed(frameDoc, 'Scroll to')
        );

        await waitFor(() => scrollTo.disabled);
    });

    it('links an activity between its users and the Activities tab', async () => {
        const frameDoc = dockFrame()!.contentDocument!;

        rowNamed(frameDoc, 'Counter')!.click();

        const inInspector = await waitFor(
            () =>
                frameDoc.querySelector('.inspector-pane') &&
                activityItem(frameDoc, '⟨count⟩')
        );

        expect(
            inInspector.querySelector('.activity-users')!.textContent
        ).to.include('Counter');
        buttonNamed(inInspector, 'Show in Activities').click();
        await waitFor(
            () =>
                frameDoc.querySelector('.activities-pane') &&
                activityItem(frameDoc, '⟨count⟩')
        );

        const user = activityItem(
            frameDoc,
            '⟨count⟩'
        )!.querySelector<HTMLElement>('.activity-users .owner-link')!;

        expect(user.textContent!.trim()).to.equal('Counter');
        user.click();
        await waitFor(() =>
            frameDoc
                .querySelector('.tree-row.is-selected .tree-name')
                ?.textContent?.includes('Counter')
        );
    });

    it('groups users by name and steps through them', async () => {
        const frameDoc = dockFrame()!.contentDocument!;

        buttonNamed(frameDoc, 'Activities').click();

        const link = await waitFor(() =>
            activityItem(frameDoc, '⟨tone⟩')?.querySelector<HTMLElement>(
                '.activity-users .owner-link'
            )
        );
        const selectedKey = () =>
            frameDoc.querySelector('.tree-row.is-selected .hud-badge')
                ?.textContent;

        expect(link.textContent!.trim()).to.equal('Swatch ×2');
        link.click();
        await waitFor(() => selectedKey() === 'key=a');
        buttonNamed(frameDoc, 'Activities').click();
        (await waitFor(() =>
            activityItem(frameDoc, '⟨tone⟩')?.querySelector<HTMLElement>(
                '.activity-users .owner-link'
            )
        ))!.click();
        await waitFor(() => selectedKey() === 'key=b');
    });

    it('stays usable over an open modal dialog', async () => {
        const frame = dockFrame()!;
        const hudWindow = frame.contentWindow;
        const dialog = document.createElement('dialog');

        document.body.append(dialog);
        dialog.showModal();

        try {
            await waitFor(() => frame.parentElement === dialog);
            expect(frame.contentWindow).to.equal(hudWindow);

            const frameDoc = frame.contentDocument!;

            buttonNamed(frameDoc, 'Activities').click();
            await waitFor(() => frameDoc.querySelector('.activities-pane'));
            dialog.close();
            await waitFor(
                () => frame.parentElement === document.documentElement
            );
            expect(hudText(frame.contentDocument)).to.include('connected');
        } finally {
            dialog.remove();
        }
    });

    it('docks at the side when chosen, and shows one panel at a time', async function () {
        this.timeout(8000);
        const frameDoc = dockFrame()!.contentDocument!;

        chooseDock(frameDoc, 'side');
        await waitFor(() => {
            const rect = dockFrame()!.getBoundingClientRect();

            return rect.right === innerWidth && rect.width === 400;
        });
        expect(document.documentElement.style.paddingRight).to.equal('400px');
        expect(
            JSON.parse(localStorage.getItem('loom-devtools:dock')!).position
        ).to.equal('side');

        const controls = Array.from(
            frameDoc.querySelectorAll('[aria-label="Dock position"] button')
        );

        expect(
            controls.map((button) => button.getAttribute('aria-label'))
        ).to.deep.equal(['Auto', 'Bottom', 'Side', 'Pop out']);
        await waitFor(
            () =>
                buttonNamed(frameDoc, 'Side').getAttribute('aria-pressed') ===
                'true'
        );

        buttonNamed(frameDoc, 'Components').click();
        (await waitFor(() => rowNamed(frameDoc, 'Leaf')))!.click();

        const split = frameDoc.querySelector('.hud-split')!;

        await waitFor(() => split.classList.contains('shows-details'));

        const path = await waitFor(
            () => frameDoc.querySelector('.details-path')?.textContent
        );

        expect(path).to.include('Counter').and.include('Branch');
        frameDoc.querySelector<HTMLElement>('.back-button')!.click();
        await waitFor(() => split.classList.contains('shows-tree'));
    });

    it('collapses a side dock to a strip', async () => {
        const frameDoc = dockFrame()!.contentDocument!;

        frameDoc.querySelector<HTMLElement>('.collapse-button')!.click();
        await waitFor(
            () => dockFrame()!.getBoundingClientRect().width === COLLAPSED_SIZE
        );
        expect(!!frameDoc.querySelector('.hud.is-strip')).to.be.true;
        frameDoc.querySelector<HTMLElement>('.collapse-button')!.click();
        await waitFor(() => dockFrame()!.getBoundingClientRect().width === 400);
    });

    it('switches edges automatically with the window, unless one is chosen', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        // `innerWidth` is an own property of `window`: restore it, never
        // delete it.
        const realWidth = Object.getOwnPropertyDescriptor(
            window,
            'innerWidth'
        )!;
        const resizeTo = (width: number) => {
            Object.defineProperty(window, 'innerWidth', {
                configurable: true,
                value: width
            });
            dispatchEvent(new Event('resize'));
        };
        const atSide = () => dockFrame()!.getBoundingClientRect().top === 0;

        try {
            chooseDock(frameDoc, 'auto');
            await waitFor(() => !atSide());
            resizeTo(1200);
            await waitFor(atSide);
            resizeTo(800);
            await waitFor(() => !atSide());
            chooseDock(frameDoc, 'bottom');
            resizeTo(1200);
            await new Promise((resolve) => setTimeout(resolve, 200));
            expect(atSide()).to.be.false;
        } finally {
            Object.defineProperty(window, 'innerWidth', realWidth);
            chooseDock(frameDoc, 'auto');
            dispatchEvent(new Event('resize'));
            await waitFor(() => !atSide());
        }
    });

    it('collapses to a bar and remembers it across a reopen', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const handle = () =>
            document.querySelector<HTMLElement>(
                '[title="Drag to resize devtools"]'
            );

        frameDoc
            .querySelector<HTMLElement>('[aria-label="Collapse devtools"]')!
            .click();
        await waitFor(
            () => dockFrame()!.getBoundingClientRect().height === COLLAPSED_SIZE
        );
        expect(handle()!.style.display).to.equal('none');

        backend.deactivate();
        expect(document.scrollingElement!.scrollHeight).to.equal(
            document.scrollingElement!.clientHeight
        );
        backend = createBackend(window);
        backend.open('dock');
        expect(dockFrame()!.getBoundingClientRect().height).to.equal(
            COLLAPSED_SIZE
        );

        const reopened = await waitFor(() =>
            dockFrame()!.contentDocument?.querySelector<HTMLElement>(
                '[aria-label="Expand devtools"]'
            )
        );

        reopened.click();
        await waitFor(
            () => dockFrame()!.getBoundingClientRect().height > COLLAPSED_SIZE
        );
        await waitFor(() =>
            hudText(dockFrame()!.contentDocument).includes('Counter')
        );
    });

    it('pops out into a floating window that reserves no page space', async () => {
        const frameDoc = dockFrame()!.contentDocument!;

        buttonNamed(frameDoc, 'Pop out').click();
        await waitFor(() => !!grip() && grip()!.style.display !== 'none');

        const { float } = floatState();
        const frame = dockFrame()!.getBoundingClientRect();

        expect(frame.left).to.equal(float.x);
        expect(frame.top).to.equal(float.y + GRIP_SIZE);
        expect(document.documentElement.style.paddingRight).to.equal('');
        expect(document.scrollingElement!.scrollHeight).to.equal(
            document.scrollingElement!.clientHeight
        );
        await waitFor(() => !!buttonNamed(frameDoc, 'Dock'));
        expect(
            Array.from(
                frameDoc.querySelectorAll('[aria-pressed="true"][value]')
            )
        ).to.be.empty;
    });

    it('moves by its drag bar and resizes from its edges and corners', async () => {
        const before = floatState().float;

        drag(grip()!, -40, -50);
        await waitFor(() => floatState().float.x === before.x - 40);
        expect(floatState().float.y).to.equal(before.y - 50);
        expect(dockFrame()!.getBoundingClientRect().left).to.equal(
            before.x - 40
        );

        drag(floatEdge('se')!, 40, 30);
        await waitFor(() => floatState().float.width === before.width + 40);
        expect(floatState().float.height).to.equal(before.height + 30);

        // Growing from the far corner moves the near edges out.
        const grown = floatState().float;

        drag(floatEdge('nw')!, -20, -20);
        await waitFor(() => floatState().float.width === grown.width + 20);
        expect(floatState().float).to.include({
            height: grown.height + 20,
            x: grown.x - 20,
            y: grown.y - 20
        });
    });

    it('minimizes to a logo button in a bottom corner that drags, snaps and restores', async () => {
        const frameDoc = dockFrame()!.contentDocument!;
        const before = floatState().float;

        buttonNamed(frameDoc, 'Minimize devtools').click();
        await waitFor(() => !!bubble() && bubble()!.style.display !== 'none');
        expect(dockFrame()!.style.display).to.equal('none');
        expect(bubble()!.querySelectorAll('circle')).to.have.length(7);

        const rect = bubble()!.getBoundingClientRect();

        expect(rect.right).to.be.closeTo(innerWidth - 16, 1);
        expect(rect.bottom).to.equal(innerHeight - 16);

        // Let go in the left half: it snaps into the bottom-left corner.
        drag(bubble()!, -(rect.left - 100), -200);
        await waitFor(() => bubble()!.style.left === '16px');
        expect(bubble()!.style.top).to.equal(`${innerHeight - 36 - 16}px`);

        drag(bubble()!, 0, 0);
        await waitFor(() => dockFrame()!.style.display === '');
        expect(bubble()!.style.display).to.equal('none');
        expect(floatState().float).to.deep.equal(before);

        // Shown again, it starts from the bottom-right corner.
        (
            await waitFor(() => buttonNamed(frameDoc, 'Minimize devtools'))
        ).click();
        await waitFor(() => bubble()!.style.display !== 'none');
        expect(bubble()!.getBoundingClientRect().right).to.be.closeTo(
            innerWidth - 16,
            1
        );
        drag(bubble()!, 0, 0);
        await waitFor(() => dockFrame()!.style.display === '');
    });

    it('docks again from the floating window', async () => {
        buttonNamed(dockFrame()!.contentDocument!, 'Dock').click();
        await waitFor(() => grip()?.style.display === 'none');
        expect(floatState().floating).to.be.false;
        expect(dockFrame()!.getBoundingClientRect().bottom).to.equal(
            innerHeight
        );
    });

    it('pops out inside a viewport that narrowed while docked', async () => {
        const realWidth = Object.getOwnPropertyDescriptor(
            window,
            'innerWidth'
        )!;
        const frameDoc = dockFrame()!.contentDocument!;

        try {
            Object.defineProperty(window, 'innerWidth', {
                configurable: true,
                value: 600
            });
            dispatchEvent(new Event('resize'));
            buttonNamed(frameDoc, 'Pop out').click();
            await waitFor(() => grip()?.style.display !== 'none');

            const { float } = floatState();
            const stored = JSON.parse(
                localStorage.getItem('loom-devtools:hud')!
            ).float;

            expect(float.x + float.width).to.be.at.most(600);
            expect(stored).to.deep.equal(float);
        } finally {
            Object.defineProperty(window, 'innerWidth', realWidth);
            buttonNamed(frameDoc, 'Dock').click();
            await waitFor(() => grip()?.style.display === 'none');
        }
    });
});
