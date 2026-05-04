import { registerCustomElement } from './lib/templating';
import type {
    ComponentProps,
    ContextFunction,
    SimpleTemplateFunction
} from './types';

export const simple = <Props extends object>(
    simpleTemplateFn: SimpleTemplateFunction<ComponentProps<Props>>
) => {
    const simpleFunction: (props?: ComponentProps<Props>) => ContextFunction = (
        props
    ) => simpleTemplateFn((props || {}) as ComponentProps<Props>);

    registerCustomElement({
        name: simpleTemplateFn.name,
        componentFunction: simpleFunction
    });
    return simpleFunction;
};
