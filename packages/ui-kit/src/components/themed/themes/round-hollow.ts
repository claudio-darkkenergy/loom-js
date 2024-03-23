import { ThemeBorderStyle, Themed, ThemePreset } from '@loom-js/tags';
import { ThemeProps } from '@loom-js/tags';

export type { ThemeProps };

export const RoundHollow = (props: ThemeProps) =>
    Themed({
        borderStyle: ThemeBorderStyle.Round,
        preset: ThemePreset.Hollow,
        ...props
    });
