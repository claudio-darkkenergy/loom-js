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

// The polymorphic-root contract: `is` supplies the root element as a
// component value — pass core's `el('footer')` (or any Component). Arbitrary
// attribute passthrough is the `attrs` prop, not stray flat keys.
export interface PinkDynamicProps {
    is?: Component;
}

export enum PinkSize {
    XSmall = 'x-small',
    Small = 'small',
    Medium = 'medium',
    Large = 'large',
    XLarge = 'x-large'
}
