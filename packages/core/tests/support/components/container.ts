import { component } from '../../../src';
import type {
    ActivityEffect,
    AttrsTemplateTagValue,
    Component,
    ReservedProps,
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
    componentProps?: TestComponentProps & ReservedProps;
    effect?: ActivityEffect<TestComponentProps>;
    TestComponent?:
        Component<TestComponentProps> | SimpleComponent<TestComponentProps>;
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

        // `TestComponent` wrappers.
        // Not annotated as `SimpleComponent` — the default `TestComponent`
        // returns a raw `Text` node, which is outside that type's return union.
        const SimpleTestComponent = ({
            value
        }: {
            value: { [key: string]: any };
        }) =>
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
                ${
                    effect
                        ? ReactiveTestComponent()
                        : TestComponent(componentProps)
                }
            </div>
        `;
    }
);
