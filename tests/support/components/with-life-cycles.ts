import { component } from '../../../src/component';
import { LifeCycleHandler, LifeCycleHandlerProps } from '../../../src/types';
import { TestComponentProps } from './container';

export interface WithLifeCyclestPropValue {
    lifeCycles: { [P in keyof LifeCycleHandlerProps]?: LifeCycleHandler };
}

export interface WithLifeCyclesProps extends TestComponentProps {
    value: WithLifeCyclestPropValue;
}

export const WithLifeCycles = component<WithLifeCyclesProps>(
    (
        html,
        { className, onCreated, onMounted, onRendered, onUnmounted, value }
    ) => {
        onCreated((node) => value.lifeCycles.onCreated?.call(null, node));
        onMounted((node) => value.lifeCycles.onMounted?.call(null, node));
        onRendered((node) => value.lifeCycles.onRendered?.call(null, node));
        onUnmounted((node) => value.lifeCycles.onUnmounted?.call(null, node));

        return html` <div class=${className}></div> `;
    }
);
