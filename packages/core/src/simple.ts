import type {
    ComponentInputProps,
    ContextFunction,
    SimpleComponent
} from './types';

/**
 * The pass-through counterpart to `component()`: wraps a render function so
 * the implementation always receives a props object — destructure freely,
 * no `= {}` default needed — while the public `SimpleComponent` signature
 * keeps propless calls legal only when `Props` has no required members.
 * @param render Receives the caller's props (or `{}`) & returns one or more
 * `ContextFunction`s from other components.
 * @returns A `SimpleComponent`.
 */
export const simple = <Props extends object = {}>(
    render: (
        props: ComponentInputProps<Props>
    ) => ContextFunction | ContextFunction[]
) => {
    const simpleComponentFunction: SimpleComponent<Props> = (
        // The empty-object default only applies to propless calls, which the
        // public `SimpleComponent` signature permits only when `Props` has no
        // required members — so `{}` is a valid `ComponentInputProps<Props>`
        // in every legal call.
        props: ComponentInputProps<Props> = {} as ComponentInputProps<Props>
    ) => render(props);

    return simpleComponentFunction;
};
