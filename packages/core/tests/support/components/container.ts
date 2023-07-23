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
            // console.log(`SimpleTestComponent({ value: ${value} })`);
            (effect as ActivityEffect)(({ value }) => {
                console.log(
                    `SimpleTestComponent({ value: ${JSON.stringify(value)} })`
                );
                return SimpleTestComponent({ value });
            });
        const AsyncReactiveTestComponent: ReactiveComponent = () =>
            (effect as ActivityEffect)(({ value }) => {
                console.log({ value });

                const lazyComponent = async () => {
                    console.log(value);
                    return await Promise.resolve(
                        SimpleTestComponent({ value })
                    );
                };

                return lazyComponent;
            });

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
