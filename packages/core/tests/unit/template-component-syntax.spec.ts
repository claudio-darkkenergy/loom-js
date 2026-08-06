import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { compileComponentTags } from '../../src/lib/templating/compile-component-tags';
import type { PlainObject, TemplateTagValue } from '../../src/types';
import { runSetup } from '../support/run-setup';

// Specs for `openspec/changes/add-template-component-syntax` — written before
// the transform exists (tasks 2.1-2.4) against the accepted grammar in
// design.md. The unit half exercises `compileComponentTags` directly; the
// integration half renders element-syntax templates through `runSetup`.

// Fixtures — module-level so template-function identity is stable.
const Chip = component<{ label?: string }>(
    (html, { label }) => html`
        <i data-chip=${label}></i>
    `
);

const Panel = component(
    (html, { children }) => html`
        <section data-panel>${children}</section>
    `
);

let seenProps: PlainObject | null = null;
const PropsProbe = component<PlainObject>((html, props) => {
    seenProps = props;
    return html`
        <i data-probe></i>
    `;
});

const PanelAndMarker = component<{ value?: string }>(
    (html, { value }) => html`
        <div>
            <${Panel}>inner</>
            <em data-outer=${value}></em>
        </div>
    `
);

describe('template component syntax', () => {
    describe('compileComponentTags — no-op guard (task 2.4)', () => {
        it('should return null for a template with no interpolations', () => {
            expect(compileComponentTags(['<div>hi</div>'])).to.equal(null);
        });

        it('should return null for ordinary interpolations', () => {
            expect(compileComponentTags(['<div>', '</div>'])).to.equal(null);
        });

        it('should return null when `<` is not adjacent to the interpolation', () => {
            expect(compileComponentTags(['<p>a < ', '</p>'])).to.equal(null);
        });

        it('should return null for stray `</>` text when no component signal exists', () => {
            // The native parser silently drops `</>` today; without a
            // component signal the transform must not even scan.
            expect(compileComponentTags(['<div></></div>'])).to.equal(null);
        });
    });

    describe('compileComponentTags — plan shape', () => {
        let renderFake: ReturnType<typeof sinon.fake.returns>;

        beforeEach(() => {
            renderFake = sinon.fake.returns('rendered');
        });

        it('should compile a self-closing component tag with no props', () => {
            const plan = compileComponentTags(['<', '/>']);

            expect(plan).to.not.equal(null);
            expect(plan?.getters).to.have.length(1);

            const result = plan?.getters[0]?.([renderFake]);

            expect(renderFake.calledOnce, 'component called').to.be.true;
            expect(renderFake.firstCall.args[0]).to.deep.equal({});
            expect(result).to.equal('rendered');
        });

        it('should mark a component-only template as a rootless fragment', () => {
            const plan = compileComponentTags(['<', '/>']);

            expect(plan?.chunks[0]?.trimStart().startsWith('<>')).to.be.true;
        });

        it('should preserve surrounding markup and compile the tag into a slot', () => {
            const plan = compileComponentTags(['<main><', '/></main>']);

            expect(plan?.chunks).to.deep.equal(['<main>', '</main>']);
            expect(plan?.getters).to.have.length(1);
        });

        it('should compile interpolated props as JS values by reference', () => {
            const onClick = () => {};
            const plan = compileComponentTags([
                '<',
                ' label=',
                ' onClick=',
                '/>'
            ]);

            plan?.getters[0]?.([renderFake, 'Click', onClick]);

            expect(renderFake.firstCall.args[0]).to.deep.equal({
                label: 'Click',
                onClick
            });
            expect(
                renderFake.firstCall.args[0].onClick,
                'by reference'
            ).to.equal(onClick);
        });

        it('should compile boolean shorthand and quoted static strings', () => {
            const plan = compileComponentTags([
                '<',
                ' isOnlyIcon icon=\'icon-menu\' title="He said"/>'
            ]);

            plan?.getters[0]?.([renderFake]);

            expect(renderFake.firstCall.args[0]).to.deep.equal({
                icon: 'icon-menu',
                isOnlyIcon: true,
                title: 'He said'
            });
        });

        it('should keep prop names verbatim — no lowercasing', () => {
            const plan = compileComponentTags(['<', ' onClick=', '/>']);

            plan?.getters[0]?.([renderFake, 'x']);

            expect(Object.keys(renderFake.firstCall.args[0])).to.deep.equal([
                'onClick'
            ]);
        });

        it('should let a duplicate prop name win last, like an object literal', () => {
            const plan = compileComponentTags(['<', ' a="1" a="2"/>']);

            plan?.getters[0]?.([renderFake]);

            expect(renderFake.firstCall.args[0]).to.deep.equal({ a: '2' });
        });

        it('should pass `key` through as an ordinary prop', () => {
            const plan = compileComponentTags(['<', ' key=', '/>']);

            plan?.getters[0]?.([renderFake, 'k7']);

            expect(renderFake.firstCall.args[0]).to.deep.equal({ key: 'k7' });
        });

        it('should keep pass-through interpolations pass-through', () => {
            const plan = compileComponentTags(['<main>', ' <', '/></main>']);
            const text: TemplateTagValue = 'hello';

            expect(plan?.chunks).to.deep.equal(['<main>', ' ', '</main>']);
            expect(plan?.getters[0]?.([text, renderFake])).to.equal(text);
        });

        it('should compile children into a synthesized component, not raw markup', () => {
            const plan = compileComponentTags([
                '<main><',
                '><b>hi</b></></main>'
            ]);

            plan?.getters[0]?.([renderFake]);

            const props = renderFake.firstCall.args[0];
            expect(
                typeof props.children,
                'children is a ContextFunction'
            ).to.equal('function');
        });

        it('should not throw a `</>` error for a quoted static value containing no interpolation', () => {
            const plan = compileComponentTags(['<', ' a="b" x=', '/>']);

            plan?.getters[0]?.([renderFake, 1]);

            expect(renderFake.firstCall.args[0]).to.deep.equal({
                a: 'b',
                x: 1
            });
        });
    });

    describe('compileComponentTags — throws (Decisions 5, 6, 8, 9)', () => {
        it('should throw on the named closing form `</${Component}>`', () => {
            expect(() =>
                compileComponentTags(['<div><', '></', '></div>'])
            ).to.throw(Error, 'not an accepted closing form');
        });

        it('should throw on the `<//>` closing form', () => {
            expect(() =>
                compileComponentTags(['<div><', '><//></div>'])
            ).to.throw(Error, 'not an accepted closing form');
        });

        it('should throw on `</>` with no open component element', () => {
            expect(() =>
                compileComponentTags(['<div></> <', '/></div>'])
            ).to.throw(Error, 'no component element is open');
        });

        it('should throw on an unclosed component element', () => {
            expect(() =>
                compileComponentTags(['<div><', '>oops</div>'])
            ).to.throw(Error, 'unclosed component element');
        });

        it('should throw on a `$`-prefixed prop, suggesting the unprefixed name', () => {
            expect(() =>
                compileComponentTags(['<', ' $onClick=', '/>'])
            ).to.throw(Error, 'onClick');
        });

        it('should throw on an unquoted static value', () => {
            expect(() => compileComponentTags(['<', ' a=b/>'])).to.throw(
                Error,
                'unquoted'
            );
        });

        it('should throw on an interpolation inside a quoted value', () => {
            expect(() => compileComponentTags(['<', ' a="x ', '"/>'])).to.throw(
                Error,
                'within the same chunk'
            );
        });

        it('should throw on an interpolation that is not immediately after `name=`', () => {
            expect(() => compileComponentTags(['<', ' ', '=', '/>'])).to.throw(
                Error,
                'interpolation'
            );
        });

        it('should throw when the tag interpolation is not followed by whitespace, `/>`, or `>`', () => {
            expect(() => compileComponentTags(['<', 'icon="x"/>'])).to.throw(
                Error,
                'followed by'
            );
        });

        it('should throw at render time when the tag value is not callable', () => {
            const plan = compileComponentTags(['<', '/>']);

            expect(() => plan?.getters[0]?.(['not a component'])).to.throw(
                Error,
                'not callable'
            );
        });
    });

    describe('rendering (integration)', () => {
        beforeEach(() => {
            seenProps = null;
        });

        it('should render a self-closing component element with an interpolated prop', async () => {
            const TestComponent = component(
                (html) => html`
                    <main><${Chip} label=${'a'} /></main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });

            expect($test.querySelector('[data-chip="a"]')).to.exist;
        });

        it('should render equivalently to the functional form', async () => {
            const ElementForm = component(
                (html) => html`
                    <main><${Chip} label=${'same'} /></main>
                `
            );
            const FunctionalForm = component(
                (html) => html`
                    <main>${Chip({ label: 'same' })}</main>
                `
            );

            const $element = await runSetup({
                containerProps: { TestComponent: ElementForm }
            });
            const $functional = await runSetup({
                containerProps: { TestComponent: FunctionalForm }
            });

            expect($element.querySelector('main')?.innerHTML.trim()).to.equal(
                $functional.querySelector('main')?.innerHTML.trim()
            );
        });

        it('should deliver static, boolean, and interpolated props with their JS types', async () => {
            const onClick = () => {};
            const TestComponent = component(
                (html) => html`
                    <main>
                        <${PropsProbe}
                            isOnlyIcon
                            icon="icon-menu"
                            onClick=${onClick}
                            key=${'k7'}
                        />
                    </main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            expect(seenProps?.isOnlyIcon).to.equal(true);
            expect(seenProps?.icon).to.equal('icon-menu');
            expect(seenProps?.onClick, 'function by reference').to.equal(
                onClick
            );
            expect(seenProps?.key, 'key reaches props.key').to.equal('k7');
        });

        it('should render children markup, text, and interpolations inside `</>`', async () => {
            const TestComponent = component(
                (html) => html`
                    <main><${Panel}>text <b>bold</b> ${'x'}</></main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $panel = $test.querySelector('[data-panel]');

            expect($panel, 'panel rendered').to.exist;
            expect($panel?.textContent).to.contain('text');
            expect($panel?.textContent).to.contain('x');
            expect($panel?.querySelector('b')?.textContent).to.equal('bold');
        });

        it('should render nested component elements inside children', async () => {
            const TestComponent = component(
                (html) => html`
                    <main><${Panel}><${Chip} label=${'nested'} /></></main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });

            expect(
                $test.querySelector('[data-panel] [data-chip="nested"]'),
                'nested chip inside panel'
            ).to.exist;
        });

        it('should render a component-only template as a rootless fragment', async () => {
            const TestComponent = component(
                (html) => html`
                    <${Chip} label=${'solo'} />
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });

            expect($test.querySelector('[data-chip="solo"]')).to.exist;
        });

        it('should keep the enclosing component context intact across updates', async () => {
            const label = activity('before');
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${label.effect(({ value }) => PanelAndMarker({ value }))}
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $panelBefore = $test.querySelector('[data-panel]');
            expect($panelBefore, 'panel rendered').to.exist;
            expect($test.querySelector('[data-outer="before"]')).to.exist;

            label.update('after');

            // The enclosing component re-rendered correctly and the compiled
            // children did not clobber its context.
            expect($test.querySelector('[data-outer="after"]')).to.exist;
            expect($test.querySelector('[data-panel]'), 'panel still present')
                .to.exist;
        });

        it('should move element-syntax children with their keyed parents across a reorder', async () => {
            const Item = component<{ color?: string }>(
                (html, { color }) => html`
                    <div data-color=${color}><${Chip} label=${color} /></div>
                `
            );
            const colors = activity(['red', 'green', 'blue'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${colors.effect(({ value: cs }) =>
                            cs.map((color) => Item({ color, key: color }))
                        )}
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const chipOf = (color: string) =>
                $test.querySelector(`[data-color="${color}"] [data-chip]`);
            const redBefore = chipOf('red');
            const blueBefore = chipOf('blue');
            expect(redBefore, 'red chip rendered').to.exist;

            colors.update(['blue', 'red', 'green']);

            expect(chipOf('red'), 'red chip reused').to.equal(redBefore);
            expect(chipOf('blue'), 'blue chip reused').to.equal(blueBefore);
        });

        it('should throw on first render for a malformed template', async () => {
            const TestComponent = component(
                (html) => html`
                    <main></> <${Chip} /></main>
                `
            );

            try {
                await runSetup({ containerProps: { TestComponent } });
                expect.fail('expected the malformed template to throw');
            } catch (err) {
                expect((err as Error).message).to.contain(
                    'no component element is open'
                );
            }
        });
    });
});
