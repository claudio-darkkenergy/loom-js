import { component } from '../../../src';
import { TestComponentProps } from './container';

export const NodelessFragment = component<TestComponentProps>(
    (html, { value }) => html`<>${value}</>`
);

export const NodeListFragment = component<TestComponentProps>(
    (html, { value = {} }) => html`
    <>
        <h1>${value.h1}</h1>
        <p>${value.p}</p>
    </>
`
);

export const SingleNodeFragment = component<TestComponentProps>(
    (html, { value }) => html`
    <>
        <div>${value}</div>
    </>
`
);
