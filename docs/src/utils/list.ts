import { Component } from '@loomjs/core';

export const List = <T>(UIComponent: Component<T>, props: T[]) =>
    props?.map((linkProps) => UIComponent(linkProps));
