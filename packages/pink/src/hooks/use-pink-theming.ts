interface PinkThemeAvatarConfig {
    avatarBgColor: string;
}

interface PinkThemeCardConfig {
    cardBgColor: string;
    cardBorderRadius: string;
    cardPadding: string;
}

interface PinkThemeColorConfig {
    colorBorder: string;
    colorPrimary1: string;
    colorPrimary2: string;
    colorPrimary3: string;
}

interface PinkThemePageConfig {
    textColor: string;
}

export type PinkThemeConfig = PinkThemeAvatarConfig &
    PinkThemeCardConfig &
    PinkThemeColorConfig &
    PinkThemePageConfig;

export const usePinkTheming = (themeConfig: Partial<PinkThemeConfig> = {}) => ({
    style: {
        '--card-bg-color': themeConfig.cardBgColor,
        '--card-border-radius': themeConfig.cardBorderRadius,
        '--card-padding': themeConfig.cardPadding,
        '--color-border': themeConfig.colorBorder,
        '--color-primary-100': themeConfig.colorPrimary1,
        '--color-primary-200': themeConfig.colorPrimary2,
        '--color-primary-300': themeConfig.colorPrimary3,
        // @TODO Will only work when nested w/in the `.avatar` class selector.
        '--p-avatar-bg-color-default': themeConfig.avatarBgColor,
        '--p-text-color': themeConfig.textColor
    }
});
