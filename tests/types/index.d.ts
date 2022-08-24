import { LifeCycleHandler, LifeCycleHandlerProps } from '../../src/types';

export type LifeCyclesProp = {
    [P in keyof LifeCycleHandlerProps]?: LifeCycleHandler;
};
