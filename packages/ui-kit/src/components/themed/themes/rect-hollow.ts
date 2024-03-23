import {
    ThemeBorderStyle,
    Themed,
    ThemePreset
} from '@loom-js/ui-kit/styled/themed';

export type { ThemeProps };

export const RectHollow = (props: ThemeProps) =>
    Themed({
        borderStyle: ThemeBorderStyle.Sharp,
        preset: ThemePreset.Hollow,
        ...props
    });
