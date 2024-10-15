import { Component } from '@loom-js/core';

export enum PinkColor {
    Blue = 'blue',
    Green = 'green',
    Orange = 'orange',
    Pink = 'pink',
    Red = 'red',
    Default = 'default',
    Empty = 'empty'
}

export interface PinkDynamicProps {
    is?: Component | any;
    [key: string | symbol]: unknown;
}

export enum PinkSize {
    XSmall = 'x-small',
    Small = 'small',
    Medium = 'medium',
    Large = 'large',
    XLarge = 'x-large'
}
