import { expect } from '@esm-bundle/chai';
import { executeServerCommand } from '@web/test-runner-commands';

import { component } from '../../src';
import {
    CONSOLE_CAPTURE_START,
    CONSOLE_CAPTURE_STOP
} from '../support/console-capture-plugin.mjs';
import { runSetup } from '../support/run-setup';

// Specs for `template-instance-plan`'s "SVG attributes never hold the
// placeholder": the engine validates SVG attribute values as it parses and
// clones, and logs its own console error for each invalid one.

interface ConsoleEntry {
    text: string;
    type: string;
}

const ATTRIBUTE_ERROR = /attribute [\w:-]+: /i;

const Shape = component<{ index: number }>(
    (html, { index }) => html`
        <svg data-shape viewBox=${`0 0 ${20 + index} 10`}>
            <rect x=${index} width=${10 + index} height="5" />
            <path d=${`M0 0 L${index} 10`} />
        </svg>
    `
);

describe('SVG attribute slots', () => {
    it('should render several instances without attribute parse errors, each under its authored name', async () => {
        await executeServerCommand(CONSOLE_CAPTURE_START);

        const $test = await runSetup({
            containerProps: {
                TestComponent: component(
                    (html) => html`
                        <div data-svg-slots-test>
                            ${Shape({ index: 0 })}${Shape({ index: 1 })}${Shape(
                                { index: 2 }
                            )}
                        </div>
                    `
                )
            }
        });
        const messages =
            (await executeServerCommand<ConsoleEntry[], undefined>(
                CONSOLE_CAPTURE_STOP
            )) ?? [];
        const shapes = Array.from(
            $test.querySelectorAll<SVGSVGElement>(
                '[data-svg-slots-test] [data-shape]'
            )
        );

        expect(
            messages
                .filter(({ text }) => ATTRIBUTE_ERROR.test(text))
                .map(({ text }) => text)
        ).to.deep.equal([]);
        expect(shapes).to.have.length(3);
        shapes.forEach((svg, index) => {
            const rect = svg.querySelector('rect') as SVGRectElement;

            expect(svg.getAttribute('viewBox')).to.equal(
                `0 0 ${20 + index} 10`
            );
            expect(svg.viewBox.baseVal.width).to.equal(20 + index);
            expect(rect.getAttribute('x')).to.equal(String(index));
            expect(rect.getAttribute('width')).to.equal(String(10 + index));
            expect(svg.querySelector('path')?.getAttribute('d')).to.equal(
                `M0 0 L${index} 10`
            );
        });
    });
});
