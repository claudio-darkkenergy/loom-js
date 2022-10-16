import { Component } from '@loom-js/core';

export const Styled =
    <T>(BaseComponent: Component<T>, style: string | ((props: T) => string)) =>
    (props = {} as T) =>
        BaseComponent({
            ...props,
            className: typeof style === 'function' ? style(props) : style
        });
