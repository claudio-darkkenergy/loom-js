import { component } from '../../../src';
import type {
    ActivityEffect,
    AttrsTemplateTagValue,
    Component,
    ComponentOptionalProps,
    ReactiveComponent,
    SimpleComponent,
    TemplateTagValue
} from '../../../src/types';
import { mergeAllowedAttrs } from '../utils';

export interface TestComponentProps {
    disabled?: boolean;
    value?: TemplateTagValue | any;
}

export interface ContainerProps {
    asyncEffect?: boolean;
    componentProps?: TestComponentProps & ComponentOptionalProps;
    effect?: ActivityEffect<TestComponentProps>;
    TestComponent?:
        | Component<TestComponentProps>
        | SimpleComponent<TestComponentProps>;
}

export const Container = component<ContainerProps>(
    (
        html,
        {
            asyncEffect = false,
            attrs,
            componentProps = {},
            effect,
            on,
            TestComponent = ({ value = 'loading...' }: TestComponentProps) =>
                document.createTextNode(String(value)),
            ...containerProps
        }
    ) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            containerProps as unknown as AttrsTemplateTagValue
        );

        // `TestComponent` wrappers
        const SimpleTestComponent: SimpleComponent<{
            value: { [key: string]: any };
        }> = ({ value }) =>
            TestComponent({
                ...componentProps,
                ...Object.assign({}, value)
            });
        const ReactiveTestComponent: ReactiveComponent = () =>
            (effect as ActivityEffect<TestComponentProps>)(({ value }) => {
                return SimpleTestComponent({ value });
            });

        return html`
            <div $attrs=${attrsOverrides} $on=${on}>
                ${effect
                    ? ReactiveTestComponent()
                    : TestComponent(componentProps)}
            </div>
        `;
    }
);
