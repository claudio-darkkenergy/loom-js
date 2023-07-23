import {
    ThemeBorderStyle,
    Themed,
    ThemePreset
} from '@app/component/styled/themed';
import { ThemeProps } from '@app/component/styled/themed/types';

export type { ThemeProps };

export const RoundHollow = (props: ThemeProps) =>
    Themed({
        borderStyle: ThemeBorderStyle.Round,
        preset: ThemePreset.Hollow,
        ...props
    });
