interface PinkThemeAvatarConfig {
    avatarBgColor: string;
}

interface PinkThemeCardConfig {
    cardBgColor: string;
    cardBorderRadius: string;
    cardPadding: string;
    // Replaces `cardPadding` at pink's first breakpoint and below.
    cardPaddingMobile: string;
}

interface PinkThemeColorConfig {
    colorBorder: string;
    colorPrimary1: string;
    colorPrimary2: string;
    colorPrimary3: string;
}

type PinkThemeFontConfig = {
    headingFont: string;
    contentFont: string;
};

interface PinkThemePageConfig {
    textColor: string;
}

export type PinkThemeConfig = PinkThemeAvatarConfig &
    PinkThemeCardConfig &
    PinkThemeColorConfig &
    PinkThemeFontConfig &
    PinkThemePageConfig;

/**
 * Theme overrides as an inline style for the app root. Color values are HSL
 * triplets (`'343 87% 56%'`), pink's convention. Every knob is a CSS custom
 * property the stylesheet reads with a fallback, so it applies to the whole
 * subtree in either theme; `textColor` also sets the root's `color`, since
 * body text inherits a computed color rather than re-reading the variable.
 */
export const usePinkTheming = (themeConfig: Partial<PinkThemeConfig> = {}) => ({
    style: {
        '--avatar-bg-color': themeConfig.avatarBgColor,
        '--card-bg-color': themeConfig.cardBgColor,
        '--card-border-radius': themeConfig.cardBorderRadius,
        '--card-padding': themeConfig.cardPadding,
        '--card-padding-mobile': themeConfig.cardPaddingMobile,
        '--color-border': themeConfig.colorBorder,
        '--color-primary-100': themeConfig.colorPrimary1,
        '--color-primary-200': themeConfig.colorPrimary2,
        '--color-primary-300': themeConfig.colorPrimary3,
        // Fonts
        '--content-font': themeConfig.contentFont,
        '--heading-font': themeConfig.headingFont,
        // Page text
        '--p-body-text-color': themeConfig.textColor,
        color:
            themeConfig.textColor === undefined
                ? undefined
                : 'hsl(var(--p-body-text-color))'
    }
});
