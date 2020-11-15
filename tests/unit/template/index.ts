import { DOMWindow, JSDOM } from 'jsdom';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';

import { Framework } from '../../../src/framework';
import { ActivityContext } from '../../../src/types';
import { tdd, chai } from '../../support/intern-interfaces';

const { before, suite, test } = tdd;
const { expect } = chai;

suite('Template', () => {
    const mockImport = proxyquire.noCallThru();
    const TemplateMock = mockImport('../../../src/template', {
        './get-update': { getUpdate: sinon.stub() },
        './set-dynamic-nodes': { setDynamicNodes: sinon.stub() }
    }).Template;
    const { appId } = {
        appId: 'app'
    };
    const htmlDoc = `
        <!DOCTYPE html>
        <html lang="en">
          <body id="${appId}">
          </body>
        </html>
    `;
    let window: DOMWindow;
    let document: Document;
    const ctx: ActivityContext = {};
    let render: typeof TemplateMock;

    before(() => {
        window = new JSDOM(htmlDoc).window;
        document = window.document;
        new Framework({
            config: { global: window as any },
            rootNode: document.getElementById(appId)
        });
        render = TemplateMock.bind(ctx);
    });

    test('should return a DocumentFragment', () => {
        expect((render as any)`<h1>Hello World!</h1>`).to.be.instanceOf(
            window.DocumentFragment
        );
    });
});
