import { component } from '../../../src/component';
import { LifeCycleHandlerProps } from '../../../src/types';
import { TestComponentProps } from './container';

export interface WithLifeCyclestPropValue {
    lifeCycles: LifeCycleHandlerProps;
}

export interface WithLifeCyclesProps extends TestComponentProps {
    value: WithLifeCyclestPropValue;
}

export const WithLifeCycles = component<WithLifeCyclesProps>(
    (
        html,
        {
            className,
            onCreated,
            onMounted,
            onBeforeRender,
            onRendered,
            onUnmounted,
            value
        }
    ) => {
        onCreated((node) => value.lifeCycles.created?.call(null, node));
        onMounted((node) => value.lifeCycles.mounted?.call(null, node));
        onBeforeRender((node) =>
            value.lifeCycles.beforeRender?.call(null, node)
        );
        onRendered((node) => value.lifeCycles.rendered?.call(null, node));
        onUnmounted((node) => value.lifeCycles.unmounted?.call(null, node));

        return html` <div class=${className}></div> `;
    }
);
