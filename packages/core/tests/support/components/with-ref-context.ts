import { component } from '../../../src';
import { Component, LifeCycleHandlerProps } from '../../../src/types';
import { TestComponentProps } from './container';

export interface WithRefContextPropValue {
    child: Component;
    refLifeCycles: LifeCycleHandlerProps;
}

export interface WithRefContextProps extends TestComponentProps {
    value?: WithRefContextPropValue;
}

export const WithRefContext = component<WithRefContextProps>(
    (html, { className, ctx, value }) => {
        const ref = ctx();

        ref.onCreated(value?.refLifeCycles.created?.bind(ref));
        ref.onMounted(value?.refLifeCycles.mounted?.bind(ref));
        ref.onRendered(value?.refLifeCycles.beforeRender?.bind(ref));
        ref.onRendered(value?.refLifeCycles.rendered?.bind(ref));
        ref.onUnmounted(value?.refLifeCycles.unmounted?.bind(ref));

        return html` <div class=${className}>${value?.child({ ref })}</div> `;
    }
);
