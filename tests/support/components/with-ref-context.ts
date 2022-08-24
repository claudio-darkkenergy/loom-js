import { LifeCyclesProp } from 'tests/types';
import { component } from '../../../src';
import { Component } from '../../../src/types';
import { TestComponentProps } from './container';

export interface WithRefContextPropValue {
    child: Component;
    refLifeCycles: LifeCyclesProp;
}

export interface WithRefContextProps extends TestComponentProps {
    value?: WithRefContextPropValue;
}

export const WithRefContext = component<WithRefContextProps>(
    (html, { className, ctx, value }) => {
        const ref = ctx();

        ref.onCreated(value.refLifeCycles.onCreated?.bind(ref));
        ref.onMounted(value.refLifeCycles.onMounted?.bind(ref));
        ref.onRendered(value.refLifeCycles.onBeforeRender?.bind(ref));
        ref.onRendered(value.refLifeCycles.onRendered?.bind(ref));
        ref.onUnmounted(value.refLifeCycles.onUnmounted?.bind(ref));

        return html` <div class=${className}>${value?.child({ ref })}</div> `;
    }
);
