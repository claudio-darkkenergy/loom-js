import { Component } from '@loom-js/core';

export const List = <T>(UIComponent: Component<T>, props: T[]) =>
    props?.map((linkProps) => UIComponent(linkProps));
