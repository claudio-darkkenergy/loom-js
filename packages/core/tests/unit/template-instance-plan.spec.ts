import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { config } from '../../src/config';
import { renderToString } from '../../src/server';
import type { ComponentContextPartial } from '../../src/types';
import { createServerWindow } from '../support/server-window';

// A template with every per-instance wiring step the plan removes: a special
// attribute to classify and strip, a standard attribute, and text with a slot
// token inside static text.
const Card = component<{ label?: string; onPick?: () => void }>(
    (html, { label, onPick }) => html`
        <article class=${label} $click=${onPick}>
            <p>Hello ${label}!</p>
        </article>
    `
);

const renderCards = (count: number) => {
    const contexts: ComponentContextPartial[] = [];

    for (let index = 0; index < count; index++) {
        const ctx: ComponentContextPartial = {};

        Card({ label: `card-${index}`, onPick: () => {} })(ctx);
        contexts.push(ctx);
    }

    return contexts;
};

describe('template instance plan', () => {
    afterEach(() => sinon.restore());

    describe('a template is wired once', () => {
        it('should classify special attributes once for 1 000 instances', () => {
            const classify = sinon.spy(config.events, 'includes');

            renderCards(1000);

            expect(
                classify.callCount,
                'event classification runs once'
            ).to.be.at.most(1);
        });

        it('should leave clones with no special attribute and no token text, without per-instance stripping', () => {
            // The first instance parses the template; the spies watch the rest.
            renderCards(1);

            const removeAttribute = sinon.spy(
                Element.prototype,
                'removeAttribute'
            );
            const createDocumentFragment = sinon.spy(
                document,
                'createDocumentFragment'
            );
            const [ctx] = renderCards(1);
            const root = ctx!.root as HTMLElement;

            expect(root.hasAttribute('$click'), '$click stripped').to.be.false;
            expect(root.textContent).to.equal('Hello card-0!');
            expect(removeAttribute.callCount, 'no per-instance strip').to.equal(
                0
            );
            expect(
                createDocumentFragment.callCount,
                'no per-instance text split'
            ).to.equal(0);
        });

        it('should reach dynamic nodes without reading child lists', () => {
            renderCards(1);

            const descriptor = Object.getOwnPropertyDescriptor(
                Node.prototype,
                'childNodes'
            )!;
            const reads = sinon.fake();

            sinon.stub(Node.prototype, 'childNodes').get(function (this: Node) {
                reads();

                return descriptor.get!.call(this);
            });

            renderCards(10);

            expect(reads.callCount, 'no childNodes reads').to.equal(0);
        });

        it('should hold a plan per document', async () => {
            const classify = sinon.spy(config.events, 'includes');
            const Page = component(
                (html) => html`
                    <main>${Card({ label: 'a' })}${Card({ label: 'b' })}</main>
                `
            );

            await renderToString(Page(), { window: createServerWindow() });
            await renderToString(Page(), { window: createServerWindow() });

            expect(classify.callCount, 'classified once per document').to.equal(
                2
            );
        });
    });

    describe('attribute slots', () => {
        it('should clone no dynamic attribute and no placeholder value', () => {
            // The first instance parses the template; the stub watches clones.
            renderCards(1);

            const importNode = document.importNode.bind(document);
            const clonedAttrs: string[][] = [];

            sinon.stub(document, 'importNode').callsFake((node, deep) => {
                const clone = importNode(node, deep) as DocumentFragment;

                clonedAttrs.push(clone.firstElementChild!.getAttributeNames());

                return clone;
            });
            renderCards(2);

            expect(
                clonedAttrs,
                'no dynamic attribute on a clone'
            ).to.deep.equal([[], []]);
        });

        it('should apply an SVG attribute under its authored case', async () => {
            const Icon = component<{ box: string }>(
                (html, { box }) => html`
                    <svg viewBox=${box}><path d="M0 0" /></svg>
                `
            );
            const ctx: ComponentContextPartial = {};

            Icon({ box: '0 0 24 24' })(ctx);

            const svg = ctx.root as SVGSVGElement;

            expect(svg.getAttributeNames()).to.deep.equal(['viewBox']);
            expect(svg.viewBox.baseVal.width).to.equal(24);
            expect(
                await renderToString(Icon({ box: '0 0 16 16' }), {
                    window: createServerWindow()
                })
            ).to.contain('viewBox="0 0 16 16"');
        });

        it('should keep text that ends in `=` as text', () => {
            const Equation = component<{ value: number }>(
                (html, { value }) => html`
                    <p title=${'sum'}>a=${value}</p>
                `
            );
            const ctx: ComponentContextPartial = {};

            Equation({ value: 3 })(ctx);

            const paragraph = ctx.root as HTMLElement;

            expect(paragraph.textContent).to.equal('a=3');
            expect(paragraph.getAttributeNames()).to.deep.equal(['title']);
        });
    });

    describe('an instance holds slots', () => {
        it('should hold one slot per dynamic path, each on a node of its clone', () => {
            const [ctx] = renderCards(1);
            const root = ctx!.root as HTMLElement;

            expect(ctx!.slots?.length, 'three dynamic paths').to.equal(3);
            ctx!.slots?.forEach((slot) => {
                expect(
                    root.contains(slot.node as Node),
                    'slot node lives in the clone'
                ).to.be.true;
            });
        });
    });
});
