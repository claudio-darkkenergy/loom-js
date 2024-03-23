import { expect } from '@esm-bundle/chai';
import { runSetup } from '../../support/run-setup';
import { component } from '../../../src';
import { TemplateRoot } from '../../../src/types';

export const nodeGetterSpec = () => {
    let $test: HTMLElement;
    let $unit: HTMLDivElement | null;
    const className = 'test-unit';
    let rootNode: TemplateRoot;

    describe('node()', () => {
        before(async () => {
            const TestComponent = component((html, { className, node }) => {
                const onClick = () => {
                    rootNode = node() as TemplateRoot;
                };

                return html`<div $click=${onClick} class=${className}></div>`;
            });

            $test = await runSetup({
                containerProps: { componentProps: { className }, TestComponent }
            });
            $unit = $test.querySelector(`.${className}`);
        });

        it('should return the node after user interaction', () => {
            $unit?.click();
            expect(rootNode).to.equal($unit);
        });
    });
};
