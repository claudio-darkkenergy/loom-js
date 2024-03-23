import { ThemeBorderStyle, Themed, ThemePreset } from '@loom-js/tags';
import { ThemeProps } from '@loom-js/tags';

export type { ThemeProps };

export const RoundSolid = (props: ThemeProps) =>
    Themed({
        borderStyle: ThemeBorderStyle.Round,
        preset: ThemePreset.Solid,
        ...props
    });
