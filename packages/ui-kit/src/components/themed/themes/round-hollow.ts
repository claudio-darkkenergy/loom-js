import {
    ThemeBorderStyle,
    Themed,
    ThemePreset
} from '@loom-js/components/styled/themed';
import { ThemeProps } from '@loom-js/components/styled/themed/types';

export type { ThemeProps };

export const RoundHollow = (props: ThemeProps) =>
    Themed({
        borderStyle: ThemeBorderStyle.Round,
        preset: ThemePreset.Hollow,
        ...props
    });
