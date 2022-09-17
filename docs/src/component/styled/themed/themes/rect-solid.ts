import {
    ThemeBorderStyle,
    Themed,
    ThemePreset
} from '@app/component/styled/themed';
import { ThemeProps } from '@app/component/styled/themed/types';

export type { ThemeProps };

export const RectSolid = (props: ThemeProps) =>
    Themed({
        borderStyle: ThemeBorderStyle.Sharp,
        preset: ThemePreset.Solid,
        ...props
    });
