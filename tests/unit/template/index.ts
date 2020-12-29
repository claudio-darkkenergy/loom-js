import { DOMWindow } from 'jsdom';

import { ActivityContext } from '../../../src/types';
import { tdd, chai } from '../../support/intern-interfaces';
import { TemplateMock } from '../../support/mocks/template';
import { NectarTestApp } from '../../support/nectar-app';

const { before, suite, test } = tdd;
const { expect } = chai;

suite('Template', () => {
    const ctx: ActivityContext = {};
    const Template = TemplateMock();
    let render: typeof Template;
    let window: DOMWindow;

    before(() => {
        const nectar = NectarTestApp();

        render = Template.bind(ctx);
        window = nectar.window;
    });

    test('should return a DocumentFragment', () => {
        expect((render as any)`<h1>Hello World!</h1>`).to.be.instanceOf(
            window.DocumentFragment
        );
    });

    test('should have only one child', () => {
        const template = (render as any)`<h1>Hello World!</h1>`;
        expect(template.childNodes.length).to.equal(1);
    });
});
