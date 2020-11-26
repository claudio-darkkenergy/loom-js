import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';

interface ComponentMockOptions {
    Template?: Function;
}

export const ComponentMock = (options?: ComponentMockOptions) =>
    proxyquire.noCallThru()('../../../src/component', {
        './template': { Template: options?.Template || sinon.stub() }
    }).Component;
