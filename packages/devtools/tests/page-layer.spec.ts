import { expect } from '@esm-bundle/chai';
import type { ComponentContextPartial } from '@loom-js/core/devtools';
import sinon from 'sinon';

import { type PageLayer, createPageLayer } from '../src/backend/page-layer';

// Specs for `devtools-inspector`'s "Outlines never cover the HUD": outlines
// clip to the visible area (here, everything above a stand-in dock at
// y = 300), and an instance outside it gets an edge indicator.

const DOCK_TOP = 300;

// Polls until `check` holds. A background test page throttles timers to
// about a second, so redraws there land late.
const until = async (check: () => boolean, timeout = 4000) => {
    const started = Date.now();

    while (!check()) {
        if (Date.now() - started > timeout) {
            throw new Error('timed out');
        }

        await new Promise((resolve) => setTimeout(resolve, 25));
    }
};

// The layer's shadow root is closed; capture it as it is attached.
const captureLayerRoot = () => {
    const original = Element.prototype.attachShadow;
    let captured: ShadowRoot | undefined;
    const stub = sinon
        .stub(Element.prototype, 'attachShadow')
        .callsFake(function (this: Element, init: ShadowRootInit) {
            const root = original.call(this, init);

            this.localName === 'loom-devtools-layer' && (captured = root);
            return root;
        });

    return {
        root: () => captured!,
        restore: () => stub.restore()
    };
};

const boxAt = (top: number, height: number) => {
    const element = document.createElement('div');

    Object.assign(element.style, {
        height: `${height}px`,
        left: '20px',
        position: 'absolute',
        top: `${top}px`,
        width: '120px'
    });
    document.body.append(element);

    return element;
};
const contextOf = (element: Element) =>
    ({ root: element }) as unknown as ComponentContextPartial;

describe('devtools page layer', () => {
    let layer: PageLayer;
    let root: ShadowRoot;
    let elements: Element[] = [];
    const visibleArea = () =>
        new DOMRect(0, 0, document.documentElement.clientWidth, DOCK_TOP);
    const outline = () => root.querySelector<HTMLElement>('.box.hover');
    const edge = () => root.querySelector<HTMLElement>('.edge');
    const place = (top: number, height: number) => {
        const element = boxAt(top, height);

        elements.push(element);
        return contextOf(element);
    };

    beforeEach(() => {
        const capture = captureLayerRoot();

        scrollTo(0, 0);
        document.body.style.height = '3000px';
        layer = createPageLayer(document, () => 'Box', { visibleArea });
        root = capture.root();
        capture.restore();
    });

    afterEach(() => {
        layer.destroy();
        elements.forEach((element) => element.remove());
        elements = [];
        document.body.style.height = '';
    });

    it('outlines a fully visible instance without an indicator', () => {
        layer.hover(place(40, 100));

        expect(outline()!.getBoundingClientRect()).to.include({
            height: 100,
            top: 40
        });
        expect(!!edge()).to.be.false;
    });

    it('clips a partly hidden instance at the dock', () => {
        layer.hover(place(250, 200));

        const rect = outline()!.getBoundingClientRect();

        expect(rect.top).to.equal(250);
        expect(rect.bottom).to.equal(DOCK_TOP);
        expect(!!edge()).to.be.false;
    });

    it('points down at an instance behind the dock, without outlining it', () => {
        layer.hover(place(400, 50));

        expect(!!outline()).to.be.false;
        expect(edge()!.textContent).to.equal('↓ Box');
        expect(edge()!.getBoundingClientRect().bottom).to.be.at.most(DOCK_TOP);
    });

    it('points up at a selection scrolled above the view, and reveals it', async function () {
        this.timeout(6000);

        const ctx = place(100, 50);
        const scroll = sinon.spy(Element.prototype, 'scrollIntoView');

        try {
            layer.select(ctx);
            scrollTo(0, 600);
            // A hidden test page never dispatches scroll events itself.
            dispatchEvent(new Event('scroll'));
            // Assert on text, not elements: a failure must stay reportable.
            await until(() => edge()?.textContent === '↑ Box');
            expect(!!root.querySelector('.box.selected')).to.be.false;
            edge()!.click();
            expect(scroll.calledOn(elements[0])).to.be.true;
        } finally {
            scroll.restore();
        }
    });

    it('clips to a scrolling ancestor, pointing at an instance scrolled out of it', () => {
        const scroller = document.createElement('div');
        const inner = document.createElement('div');

        Object.assign(scroller.style, {
            height: '100px',
            left: '20px',
            overflowY: 'auto',
            position: 'absolute',
            top: '20px',
            width: '120px'
        });
        Object.assign(inner.style, { height: '40px', marginTop: '200px' });
        scroller.append(inner);
        document.body.append(scroller);
        elements.push(scroller);
        layer.hover(contextOf(inner));

        expect(!!outline()).to.be.false;
        expect(edge()!.textContent).to.equal('↓ Box');
    });

    it('never flashes over the dock', () => {
        layer.flash(place(400, 50));

        expect(!!root.querySelector('.flash')).to.be.false;
    });
});
