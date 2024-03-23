import {
    ThemeBorderStyle,
    Themed,
    ThemePreset
} from '@loom-js/components/styled/themed';
import { ThemeProps } from '@loom-js/components/styled/themed/types';

export type { ThemeProps };

export const RectSolid = (props: ThemeProps) =>
    Themed({
        borderStyle: ThemeBorderStyle.Sharp,
        preset: ThemePreset.Solid,
        ...props
    });
