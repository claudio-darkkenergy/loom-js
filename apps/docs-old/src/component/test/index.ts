import { activity, component, MouseEventListener } from '@loom-js/core';

import { TestInput } from './test-input';

interface TestChildProps {
    onClick: MouseEventListener;
    title?: string;
}

export const TestChild = component<TestChildProps>(
    (html, { onClick, title }) => {
        return html`<h2 $click=${onClick}>${title}</h2>`;
    }
);

export const Test = component((html) => {
    return html`
        <div>
            Tubular ${'Dude'}! ${TestChildWrapper()} And ${'hello'} to my
            ${'beautiful'}... ${'world'}!
            <p>->${'And'}<-</p>
        </div>
    `;
});

const TestChildWrapper = () => {
    const { effect, initialValue, update } = activity('Test Child');
    // const ref = ctx();
    let n = 0;
    const onInput: MouseEventListener = () => {
        // console.log('clicked node', ref.node());
        update(`${initialValue} - clicked ${++n} time${n > 1 ? 's' : ''}`);
    };

    // ref.onCreated((node) => console.log('created node', node));
    // ref.onMounted((node) => console.log('mounted node', node));
    // ref.onRendered((node) => console.log('rendered node', node));
    // ref.onUnmounted((node) => console.log('unmounted node', node));

    return effect(({ value = '⚡' }) =>
        TestInput({ name: 'test-input', onInput, value })
    );
};
