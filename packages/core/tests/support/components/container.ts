import { component } from '../../../src';
import {
    ActivityEffect,
    Component,
    ReactiveComponent,
    TemplateTagValue
} from '../../../src/types';

export interface TestComponentProps {
    className?: string;
    disabled?: boolean;
    style?: string;
    value?: TemplateTagValue | any;
}

export interface ContainerProps {
    asyncEffect?: boolean;
    className?: string;
    componentProps?: TestComponentProps;
    effect?: ActivityEffect<TestComponentProps>;
    TestComponent?: Component<TestComponentProps>;
}

export const Container = component<ContainerProps>(
    (
        html,
        {
            asyncEffect = false,
            className,
            componentProps = {},
            effect,
            TestComponent = ({ value = 'loading...' }: TestComponentProps) =>
                document.createTextNode(String(value))
        }
    ) => {
        const SimpleTestComponent = ({ value }) =>
            TestComponent({
                ...componentProps,
                ...Object.assign({}, value)
            });
        const ReactiveTestComponent: ReactiveComponent = () =>
            (effect as ActivityEffect)(({ value }) =>
                SimpleTestComponent({ value })
            );
        const AsyncReactiveTestComponent: ReactiveComponent = () =>
            (effect as ActivityEffect)(
                ({ value }) =>
                    () =>
                        Promise.resolve(SimpleTestComponent({ value }))
            );

        return html`
            <div class=${className}>
                ${effect
                    ? asyncEffect
                        ? AsyncReactiveTestComponent()
                        : ReactiveTestComponent()
                    : TestComponent(componentProps)}
            </div>
        `;
    }
);
