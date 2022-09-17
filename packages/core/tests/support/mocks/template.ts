import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';

export const TemplateMock = () =>
    proxyquire.noCallThru()('../../../src/template', {
        './get-update': { getUpdate: sinon.stub() },
        './set-dynamic-nodes': { setDynamicNodes: sinon.stub() }
    }).Template;
