import { expect } from '@esm-bundle/chai';
import { runSetup } from '../../support/run-setup';
import { component } from '../../../src';
import type { RefContext } from '../../../src/types';

export const contextRefsSpec = () => {
    let $test: HTMLElement;
    let $unit: HTMLDivElement | null;
    const className = 'test-unit';
    let refs: IterableIterator<RefContext>;

    describe('ctxRefs()', () => {
        before(async () => {
            const TestComponent = component(
                (html, { className, createRef, ctxRefs }) => {
                    const RefComponent = component((html) => {
                        return html`<span></span>`;
                    });
                    const NextRefComponent = component((html) => {
                        return html`<span></span>`;
                    });
                    const refContext = createRef();
                    const nextRefContenxt = createRef();

                    refs = ctxRefs();

                    return html`
                        <div class=${className}>
                            ${RefComponent({ ref: refContext })}
                            ${NextRefComponent({ ref: nextRefContenxt })}
                        </div>
                    `;
                }
            );

            $test = await runSetup({
                containerProps: { componentProps: { className }, TestComponent }
            });
            $unit = $test.querySelector(`.${className}`);
        });

        it('should return each ref-context in the same order of creation', () => {
            expect(refs.next().value.node()).to.equal($unit?.children[0]);
            expect(refs.next().value.node()).to.equal($unit?.children[1]);
        });
    });
};
