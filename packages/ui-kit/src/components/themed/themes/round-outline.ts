import {
    ThemeBorderStyle,
    Themed,
    ThemePreset
} from '@loom-js/components/styled/themed';
import { ThemeProps } from '@loom-js/components/styled/themed/types';

export type { ThemeProps };

export const RoundOutline = (props: ThemeProps) =>
    Themed({
        borderStyle: ThemeBorderStyle.Round,
        preset: ThemePreset.Outline,
        ...props
    });
