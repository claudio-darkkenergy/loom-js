import { expect } from '@esm-bundle/chai';

import { component, defineElement } from '../../../src';
import { activity } from '../../../src/activity';
import type { PlainObject } from '../../../src/types';
import { runSetup } from '../../support/run-setup';
import { Card, Chip } from './fixtures';

// Integration specs for `add-named-slots` — labelled children rendered
// end-to-end into their named regions.

// `customElements.define` is process-global and irreversible, so this
// element's name is unique to this file.
defineElement(
    'ns-shadow-nested-unit',
    (html) => html`
        <div class="nested-root"><slot name="x"></slot></div>
    `,
    { shadow: { mode: 'open' } }
);

let seenChipProps: PlainObject | null = null;
const ChipProbe = component<PlainObject>((html, props) => {
    seenChipProps = props;
    return html`
        <i data-chip-probe></i>
    `;
});

describe('named slot rendering (integration)', () => {
    beforeEach(() => {
        seenChipProps = null;
    });

    it('should distribute labelled children into their named regions', async () => {
        const TestComponent = component(
            (html) => html`
                <main>
                    <${Card}>
                        <h2 slot="header">Title</h2>
                        <p>Body</p>
                        <b slot="footer">Fine print</b>
                        tail
                    </>
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });

        expect(
            $test.querySelector('[data-header] h2')?.textContent,
            'header content in the header region'
        ).to.equal('Title');
        expect(
            $test.querySelector('[data-footer] b')?.textContent,
            'footer content in the footer region'
        ).to.equal('Fine print');
        expect(
            $test.querySelector('[data-body] p'),
            'unlabelled markup stays in children'
        ).to.exist;
        expect(
            $test.querySelector('[data-body]')?.textContent,
            'top-level text stays in children'
        ).to.contain('tail');
        expect(
            $test.querySelector('[data-body] h2'),
            'labelled elements removed from children'
        ).to.equal(null);
    });

    it('should render nothing for an absent region', async () => {
        const TestComponent = component(
            (html) => html`
                <main><${Card}><p>Body</p></></main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $footer = $test.querySelector('[data-footer]');

        expect($footer, 'region rendered').to.exist;
        expect($footer?.textContent?.trim()).to.equal('');
    });

    it('should keep the `slot` attribute on distributed elements', async () => {
        const TestComponent = component(
            (html) => html`
                <main><${Card}><h2 slot="header">T</h2></></main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });

        expect(
            $test.querySelector('[data-header] h2[slot="header"]'),
            'attribute kept, inert in the light DOM'
        ).to.exist;
    });

    it('should concatenate same-label siblings in source order', async () => {
        const TestComponent = component(
            (html) => html`
                <main>
                    <${Card}>
                        <i slot="header">one</i>
                        <em slot="header">two</em>
                    </>
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $header = $test.querySelector('[data-header]');

        expect(
            Array.from($header?.querySelectorAll('i, em') ?? []).map(
                (el) => el.textContent
            )
        ).to.deep.equal(['one', 'two']);
    });

    it('should distribute a labelled component element and consume its `slot` prop', async () => {
        const TestComponent = component(
            (html) => html`
                <main>
                    <${Card}>
                        <${ChipProbe} slot="header" label=${'c1'} />
                        <p>Body</p>
                    </>
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });

        expect(
            $test.querySelector('[data-header] [data-chip-probe]'),
            'component rendered inside its region'
        ).to.exist;
        expect(seenChipProps?.label).to.equal('c1');
        expect(
            seenChipProps && 'slot' in seenChipProps,
            'no `slot` prop forwarded'
        ).to.be.false;
    });

    it('should render equivalently to the functional form', async () => {
        const Title = component(
            (html) => html`
                <h2>Title</h2>
            `
        );
        const Body = component(
            (html) => html`
                <p>Body</p>
            `
        );
        const ElementForm = component(
            (html) => html`
                <main><${Card}><${Title} slot="header" /><${Body} /></></main>
            `
        );
        const FunctionalForm = component(
            (html) => html`
                <main>
                    ${Card({
                        children: Body({}),
                        slots: { header: Title({}) }
                    })}
                </main>
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

    it('should update reactively inside a named region', async () => {
        const label = activity('before');
        const TestComponent = component(
            (html) => html`
                <main>
                    <${Card}>
                        <h2 slot="header">
                            ${label.effect(({ value }) =>
                                Chip({ label: value })
                            )}
                        </h2>
                        <p>Body</p>
                    </>
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });

        expect($test.querySelector('[data-header] [data-chip="before"]')).to
            .exist;

        label.update('after');

        expect($test.querySelector('[data-header] [data-chip="after"]')).to
            .exist;
        expect(
            $test.querySelector('[data-body] p'),
            'children intact across the update'
        ).to.exist;
    });

    it('should render a region interpolated at the top level of another component element’s children', async () => {
        // The PinkGridHeader shape: a component that forwards a region into
        // a wrapping component's children region — the region's fragment
        // root lands on a top-level slot of a children fragment, where
        // insertion must anchor on `parentNode` (a `DocumentFragment`), not
        // `parentElement`.
        const Section = component(
            (html, { children }) => html`
                <section data-section>${children}</section>
            `
        );
        const Cluster = component(
            (html, { slots }) => html`
                <${Section}>${slots?.a}<b data-tail>tail</b></>
            `
        );
        const TestComponent = component(
            (html) => html`
                <main>
                    <${Cluster}>
                        <i slot="a">one</i>
                        <em slot="a">two</em>
                    </>
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $section = $test.querySelector('[data-section]');

        expect($section, 'wrapper rendered').to.exist;
        expect(
            Array.from($section?.querySelectorAll('i, em, b') ?? []).map(
                (el) => el.textContent
            ),
            'region content precedes the trailing markup, in order'
        ).to.deep.equal(['one', 'two', 'tail']);
    });

    it('should leave a nested custom element to the platform — depth > 0 pass-through', async () => {
        const TestComponent = component(
            (html) => html`
                <main>
                    <${Card}>
                        <ns-shadow-nested-unit>
                            <span class="lab" slot="x">hi</span>
                        </ns-shadow-nested-unit>
                    </>
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $host = $test.querySelector('[data-body] ns-shadow-nested-unit');
        const $span = $host?.querySelector('span.lab');

        expect($host, 'custom element stayed in children').to.exist;
        expect(
            ($span as HTMLElement)?.assignedSlot,
            'native distribution applied inside the nested host'
        ).to.equal($host?.shadowRoot?.querySelector('slot[name="x"]'));
    });
});
