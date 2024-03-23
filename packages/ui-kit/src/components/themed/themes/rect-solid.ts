import { ThemeBorderStyle, Themed, ThemePreset } from '@loom-js/tags';
import { ThemeProps } from '@loom-js/tags';

export type { ThemeProps };

export const RectSolid = (props: ThemeProps) =>
    Themed({
        borderStyle: ThemeBorderStyle.Sharp,
        preset: ThemePreset.Solid,
        ...props
    });
