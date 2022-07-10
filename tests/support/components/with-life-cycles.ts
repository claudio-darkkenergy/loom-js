import { component } from '../../../src/component';
import { LifeCycleHandlerProps } from '../../../src/types';
import { TestComponentProps } from './container';

export interface WithLifeCyclestPropValue {
    lifecycles: Partial<LifeCycleHandlerProps>;
}

export interface WithLifeCyclesProps extends TestComponentProps {
    value: WithLifeCyclestPropValue;
}

export const WithLifeCycles = component<WithLifeCyclesProps>(
    (
        html,
        { className, onCreated, onMounted, onRendered, onUnmounted, value }
    ) => {
        onCreated((node) => value.lifecycles.onCreated?.call(null, node));
        onMounted((node) => value.lifecycles.onMounted?.call(null, node));
        onRendered((node) => value.lifecycles.onRendered?.call(null, node));
        onUnmounted((node) => value.lifecycles.onUnmounted?.call(null, node));

        return html` <div class=${className}></div> `;
    }
);
