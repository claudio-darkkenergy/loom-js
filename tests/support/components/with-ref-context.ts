import { activity, component } from '../../../src';
import { Component, LifeCycleHandlerProps } from '../../../src/types';
import { TestComponentProps } from './container';

export interface WithRefContextPropValue {
    child: Component;
    refLifecycles: Partial<LifeCycleHandlerProps>;
}

export interface WithRefContextProps extends TestComponentProps {
    value?: WithRefContextPropValue;
}

export const WithRefContext = component<WithRefContextProps>(
    (html, { className, ctx, value }) => {
        // const { effect, update } = activity;
        const ref = ctx();

        ref.onCreated((node) =>
            value?.refLifecycles.onCreated?.call(ref, node)
        );
        ref.onMounted((node) =>
            value?.refLifecycles.onMounted?.call(ref, node)
        );
        ref.onRendered((node) =>
            value?.refLifecycles.onRendered?.call(ref, node)
        );
        ref.onUnmounted((node) =>
            value?.refLifecycles.onUnmounted?.call(ref, node)
        );

        return html` <div class=${className}>${value?.child({ ref })}</div> `;
    }
);
