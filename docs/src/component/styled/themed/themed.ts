import { ContextFunction } from '@loomjs/core';
import classNames from 'classnames';

import styles from './styles.scss';

export interface ThemableProps {
    bgColor: string;
    color: string;
    theme: string;
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
        bgColor: styles[`bg${color}`],
        color: styles[color.toLowerCase()],
        theme: classNames(styles[borderStyle], styles[preset])
    });
