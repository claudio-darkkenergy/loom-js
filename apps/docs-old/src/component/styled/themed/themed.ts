import { ContextFunction } from '@loom-js/core';
import classNames from 'classnames';

import styles from './styles.scss';

export interface ThemableProps {
    bgColorClass: string;
    colorClass: string;
    themeClass: string;
}

export enum ThemeBorderStyle {
    Round = 'round',
    Sharp = 'sharp'
}

export enum ThemeColor {
    Current = 'Current',
    Neutral = 'Neutral',
    Primary = 'Primary',
    Text = 'Text',
    Secondary = 'Secondary'
}

export enum ThemePreset {
    Ghost = 'ghost',
    Hollow = 'hollow',
    Outline = 'outline',
    Solid = 'solid'
}

export interface ThemedProps {
    color?: ThemeColor;
    borderStyle?: ThemeBorderStyle;
    preset?: ThemePreset;
    themable: (props: ThemableProps) => ContextFunction;
}

export const Themed = ({
    borderStyle,
    color = ThemeColor.Text,
    preset,
    themable
}: ThemedProps) =>
    themable({
        bgColorClass: styles[`bg${color}`],
        colorClass: styles[color.toLowerCase()],
        themeClass: classNames(styles[borderStyle || ''], styles[preset || ''])
    });
