import { DOMWindow, JSDOM } from 'jsdom';
import * as sinon from 'sinon';

import { Framework } from '../../src/framework';
import { tdd, chai } from '../support/intern-interfaces';

const { before, suite, test } = tdd;
const { expect } = chai;

suite('Framework', () => {
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
    let app: Framework;
    let window: DOMWindow;
    let document: Document;

    before(() => {
        window = new JSDOM(htmlDoc).window;
        document = window.document;
        app = new Framework({
            config: { global: window as any },
            rootNode: document.getElementById(appId)
        });
    });

    test('should create the app', () => {
        expect(app).to.be.instanceOf(Framework);
    });

    test('should load the template with content', () => {
        const content = { greeting: 'Hello World!' };
        const node = document.createElement('H1');
        const template = sinon.spy(({ greeting }) => {
            node.textContent = greeting;
            return node;
        }) as any;
        const loadedApp = app.load({ content, template });

        expect(loadedApp).to.equal(app);
        expect(app.virtualNode.children[0]).to.equal(node);
        expect(template.calledWith(content)).to.be.true;
        expect(template.calledOnce).to.be.true;
    });

    test('should render the app', () => {
        const loadedTemplateNode = app.virtualNode.children[0];

        app.render();
        expect(app.rootNode.lastChild).to.equal(loadedTemplateNode);
    });
});
