import { expect } from '@esm-bundle/chai';
import { runSetup } from '../../support/run-setup';
import { component } from '../../../src';
import type { RefContext } from '../../../src/types';

export const createRefSpec = () => {
    let $test: HTMLElement;
    let $unit: HTMLDivElement | null;
    const className = 'test-unit';
    let refContext: RefContext;

    describe('createRef()', () => {
        before(async () => {
            const TestComponent = component(
                (html, { className, createRef }) => {
                    const RefComponent = component((html) => {
                        return html`<span></span>`;
                    });

                    refContext = createRef();

                    return html`<div class=${className}>
                        ${RefComponent({ ref: refContext })}
                    </div>`;
                }
            );

            $test = await runSetup({
                containerProps: { componentProps: { className }, TestComponent }
            });
            $unit = $test.querySelector(`.${className}`);
        });

        it('should equal the component node that receives it', () => {
            expect(refContext?.node && refContext?.node()).to.equal(
                $unit?.children[0]
            );
        });
    });
};
