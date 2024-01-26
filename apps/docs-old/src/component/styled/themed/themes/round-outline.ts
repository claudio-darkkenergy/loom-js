import {
    ThemeBorderStyle,
    Themed,
    ThemePreset
} from '@app/component/styled/themed';
import { ThemeProps } from '@app/component/styled/themed/types';

export type { ThemeProps };

export const RoundOutline = (props: ThemeProps) =>
    Themed({
        borderStyle: ThemeBorderStyle.Round,
        preset: ThemePreset.Outline,
        ...props
    });
