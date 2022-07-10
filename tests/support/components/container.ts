import { component } from '../../../src';
import {
    ActivityEffect,
    Component,
    TemplateTagValue
} from '../../../src/types';

export interface TestComponentProps {
    className?: string;
    disabled?: boolean;
    style?: string;
    value?: TemplateTagValue | any;
}

export interface ContainerProps {
    className?: string;
    componentProps?: TestComponentProps;
    effect?: ActivityEffect<TestComponentProps>;
    TestComponent?: Component<TestComponentProps>;
}

export const Container = component<ContainerProps>(
    (
        html,
        {
            className,
            componentProps = {},
            effect,
            TestComponent = ({ value = 'loading...' }: TestComponentProps) =>
                document.createTextNode(String(value))
        }
    ) => html`
        <div class=${className}>
            ${effect
                ? effect(({ value }) =>
                      TestComponent({
                          ...componentProps,
                          ...Object.assign({}, value)
                      })
                  )
                : TestComponent(componentProps)}
        </div>
    `
);
