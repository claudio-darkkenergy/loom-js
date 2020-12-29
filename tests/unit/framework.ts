import * as sinon from 'sinon';

import { Framework } from '../../src/framework';
import { tdd, chai } from '../support/intern-interfaces';
import { NectarTestApp } from '../support/nectar-app';

const { before, suite, test } = tdd;
const { expect } = chai;

suite('Framework', () => {
    let app: Framework;
    let document: Document;

    before(() => {
        const nectar = NectarTestApp();

        app = nectar.app;
        document = nectar.document;
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
