import { expect } from '@esm-bundle/chai';

import { Picture, Svg, component } from '../../../src';
import type { SourceProps } from '../../../src';
import { runSetup } from '../../support/run-setup';

// Specs for the media components (`add-core-element-components` design
// Decision 4): Svg ports the sprite convention; Picture absorbs the
// responsive chooser — no sources renders a bare <img>.

describe('media components', () => {
    it('should compose an Svg sprite reference with size over height/width', async () => {
        const TestComponent = component(
            (html) => html`
                <main>
                    <${Svg}
                        className="icon"
                        path="/static/svg/sprite.svg"
                        size="20"
                        svgId="logo"
                    />
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $svg = $test.querySelector('svg');
        const $use = $svg?.querySelector('use');

        expect($svg, 'svg rendered').to.exist;
        expect($svg?.getAttribute('fill')).to.equal('currentColor');
        expect($svg?.getAttribute('height')).to.equal('20');
        expect($svg?.getAttribute('width')).to.equal('20');
        expect($svg?.classList.contains('icon')).to.be.true;
        expect($use?.getAttribute('href')).to.equal(
            '/static/svg/sprite.svg#logo'
        );
    });

    it('should fall back to height/width and default to 1em', async () => {
        const TestComponent = component(
            (html) => html`
                <main>
                    ${Svg({ height: '10', path: '/s.svg', width: '30' })}
                    ${Svg({ attrs: { 'data-default': 'true' }, path: '/s.svg' })}
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const [$sized, $default] = Array.from($test.querySelectorAll('svg'));

        expect($sized?.getAttribute('height')).to.equal('10');
        expect($sized?.getAttribute('width')).to.equal('30');
        expect($default?.getAttribute('height')).to.equal('1em');
        expect($default?.getAttribute('width')).to.equal('1em');
    });

    it('should render a picture element when sources are supplied', async () => {
        const sources: SourceProps[] = [
            {
                media: '(min-width: 600px)',
                srcset: '/big.avif',
                type: 'image/avif'
            }
        ];
        const TestComponent = component(
            (html) => html`
                <main>
                    ${Picture({ alt: 'scenic', sources, src: '/small.jpg' })}
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $picture = $test.querySelector('picture');
        const $source = $picture?.querySelector('source');
        const $img = $picture?.querySelector('img');

        expect($picture, 'picture rendered').to.exist;
        expect($source?.getAttribute('media')).to.equal('(min-width: 600px)');
        expect($source?.getAttribute('srcset')).to.equal('/big.avif');
        expect($source?.getAttribute('type')).to.equal('image/avif');
        expect($img?.getAttribute('src')).to.equal('/small.jpg');
        expect($img?.getAttribute('alt')).to.equal('scenic');
    });

    it('should render a bare img when no sources are supplied', async () => {
        const TestComponent = component(
            (html) => html`
                <main>${Picture({ alt: 'plain', src: '/only.jpg' })}</main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });

        expect($test.querySelector('picture'), 'no picture wrapper').to.not
            .exist;
        expect($test.querySelector('img')?.getAttribute('src')).to.equal(
            '/only.jpg'
        );
        expect($test.querySelector('img')?.getAttribute('alt')).to.equal(
            'plain'
        );
    });

    it('should render an empty sources array as a bare img', async () => {
        const TestComponent = component(
            (html) => html`
                <main>${Picture({ sources: [], src: '/edge.jpg' })}</main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });

        expect($test.querySelector('picture'), 'no picture wrapper').to.not
            .exist;
        expect($test.querySelector('img')?.getAttribute('src')).to.equal(
            '/edge.jpg'
        );
    });
});
