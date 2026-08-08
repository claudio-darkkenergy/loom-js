import { expect } from '@esm-bundle/chai';

import { component } from '../../../src';
import { activity } from '../../../src/activity';
import { runSetup } from '../../support/run-setup';
import { Chip, Panel, PanelAndMarker, PropsProbe, probed } from './fixtures';

// Integration specs for `add-template-component-syntax` — element-syntax
// templates rendered end-to-end through `runSetup`.

describe('component element rendering (integration)', () => {
    beforeEach(() => {
        probed.props = null;
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

        expect(probed.props?.isOnlyIcon).to.equal(true);
        expect(probed.props?.icon).to.equal('icon-menu');
        expect(probed.props?.onClick, 'function by reference').to.equal(
            onClick
        );
        expect(probed.props?.key, 'key reaches props.key').to.equal('k7');
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
        expect($test.querySelector('[data-panel]'), 'panel still present').to
            .exist;
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
