import { Component } from '@loom-js/core';

export enum PinkColor {
    Blue = 'blue',
    Green = 'green',
    Orange = 'orange',
    Pink = 'pink',
    Red = 'red',
    Empty = 'empty'
}

export interface PinkDynamicProps {
    is?: Component;
    [key: string | symbol]: unknown;
}

export enum PinkSize {
    Large = 'large',
    Small = 'small',
    XLarge = 'x-large',
    XSmall = 'x-small'
}
