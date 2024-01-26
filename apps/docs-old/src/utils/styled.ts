import { Component, SimpleComponent } from '@loom-js/core';

export const Styled =
    <T extends {}>(
        BaseComponent: Component<T> | SimpleComponent<T>,
        style: string | ((props: T) => string)
    ) =>
    (props = {} as T) =>
        BaseComponent({
            ...props,
            className: typeof style === 'function' ? style(props) : style
        });
