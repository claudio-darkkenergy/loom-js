import '@appwrite.io/pink';
import '@appwrite.io/pink-icons';
import {
    type Component,
    type ComponentOptionalProps,
    type ComponentProps,
    type ContextFunction,
    init,
    type SimpleComponent
} from '@loom-js/core';
import { usePinkTheming } from '@loom-js/pink';

new EventSource('/esbuild').addEventListener('change', () => location.reload());

// Bootstrap the app.
const bodyBgColor = '0, 0%, 93%';
const $app = document.createElement('div');

$app.style.height = '100%';
$app.innerText = 'loading...';

document.body.classList.add('theme-dark');
// document.body.style.setProperty('--p-body-bg-color', bodyBgColor);
document.body.prepend($app);

export const Bootstrap = (
    page:
        | Component
        | SimpleComponent
        | ((props: ComponentOptionalProps) => ContextFunction | undefined),
    { style, ...pageProps }: ComponentProps = {}
) => {
    const themeColorHue = 301;

    init({
        app: page({
            ...pageProps,
            style: [
                usePinkTheming({
                    // avatarBgColor: bodyBgColor,
                    // colorBorder: `${themeColorHue}, 58%, 36%`,
                    // colorPrimary1: `${themeColorHue}, 58%, 46%`,
                    // colorPrimary2: `${themeColorHue}, 58%, 36%`,
                    // colorPrimary3: `${themeColorHue}, 58%, 26%`
                    headingFont: 'Pelinka-ExtraBold',
                    contentFont: 'Pelinka-Regular'
                }).style,
                style
            ]
        }) as ContextFunction,
        // append: false,
        globalConfig: {
            debug: true,
            debugScope: {
                activity: false,
                console: true,
                creation: false,
                error: true,
                mutations: false,
                updates: false,
                warn: true
            }
        },
        root: $app
    });
};
