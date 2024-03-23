import { expect } from '@esm-bundle/chai';
import { component, lazyImport, onRoute, onRouteUpdate } from '../../src';
import type { Component } from '../../src/types';
import { runSetup } from '../support/run-setup';

const SimpleComponent1 = component((html) => {
    return html` <h1>${'SimpleComponent1'}</h1> `;
});
const SimpleComponent2 = component((html) => {
    return html`
            <>
                <h1>${'SimpleComponent2'}</h1>
            </>
        `;
});

const Routes = () => {
    const { effect: lazyRouteEffect, update: updateLazyImport } = lazyImport<
        Component<{}>
    >('route', () => Promise.resolve(SimpleComponent1));

    onRouteUpdate(({ value: { pathname } }) => {
        let component: Component;

        console.log({ pathname });
        switch (true) {
            case pathname === '/simple1':
                component = SimpleComponent1;
                break;
            default:
                component = SimpleComponent2;
        }

        updateLazyImport(() => Promise.resolve(component));
    });

    return lazyRouteEffect(({ value: lazyComponent }: { value: any }) => {
        return lazyComponent && (lazyComponent as Component)();
    });
};

const TestComponent = component(
    (html) => html`
<>
    [<a $click=${onRoute} href="/simple1">Simple 1</a> |
    <a $click=${onRoute} href="/simple2">Simple 2</a>]
    <div>${Routes()}</div>
</>
`
);

describe('lazyImport', () => {
    let $test: HTMLElement;
    let $container: HTMLDivElement | null;
    let $unit: HTMLElement | null | undefined;
    let $anchorSimple1: HTMLAnchorElement | null;
    let $anchorSimple2: HTMLAnchorElement | null;

    before(async () => {
        $test = await runSetup({
            containerProps: {
                TestComponent
            }
        });
        $container = $test.children[0] as HTMLDivElement;
        $anchorSimple1 = $container.querySelector('a[href="/simple1"]');
        $anchorSimple2 = $container.querySelector('a[href="/simple2"]');
    });

    it('should load the lazy route', async () => {
        $unit = $container?.querySelector('h1');
        expect($unit?.textContent?.trim()).to.equal('SimpleComponent2');

        $anchorSimple1?.click();
        await Promise.resolve();
        $unit = $container?.querySelector('h1');
        expect($unit?.textContent?.trim()).to.equal('SimpleComponent1');

        $anchorSimple2?.click();
        await Promise.resolve();
        $unit = $container?.querySelector('h1');
        expect($unit?.textContent?.trim()).to.equal('SimpleComponent2');
    });

    it('should load the resource from the import cache', async () => {
        const { watch: watchLazyImport } = lazyImport<boolean>(
            'cache-import',
            () => Promise.resolve(true)
        );
        let callCount = 0;

        watchLazyImport(({ value }) => {
            const resource = value as boolean | undefined;

            callCount++;

            switch (callCount) {
                case 1:
                    expect(resource).to.be.undefined;
                    break;
                case 2:
                    expect(resource).to.be.true;
            }
        });

        await Promise.resolve();
        const { watch: watchLazyImport2 } = lazyImport<boolean>(
            'cache-import',
            () => Promise.resolve(false)
        );

        watchLazyImport2(({ value: resource }) => {
            expect(resource as boolean | undefined).to.be.true;
        });
    });
});
