import '@appwrite.io/pink';
import '@appwrite.io/pink-icons';
import {
    type Component,
    type ComponentInputProps,
    type ContextFunction,
    init,
    type SimpleComponent,
    ReservedProps
} from '@loom-js/core';
import { usePinkTheming } from '@loom-js/pink';

if (__DEV__) {
    // esbuild's live-reload hook — the define makes this dead code in prod,
    // so the minifier drops it entirely.
    new EventSource('/esbuild').addEventListener('change', () =>
        location.reload()
    );
}

if (!__DEV__) {
    // MyFonts license count beacon — previously a render-blocking CSS
    // `@import`; fired async so it never sits in the critical path, and only
    // on production traffic.
    fetch('https://hello.myfonts.net/count/40024c', { mode: 'no-cors' }).catch(
        () => undefined
    );
}

// Bootstrap the app.
const bodyBgColor = '0, 0%, 93%';
const $app = document.createElement('div');

$app.style.height = '100%';
$app.innerText = 'loading...';

document.body.classList.add('theme-dark');
// document.body.style.setProperty('--p-body-bg-color', bodyBgColor);
document.body.prepend($app);

export const Bootstrap = (
    page: Component | SimpleComponent,
    { style, ...pageProps }: ComponentInputProps = {}
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
            debug: __DEV__,
            debugScope: {
                activity: false,
                console: true,
                creation: false,
                error: true,
                mutations: false,
                updates: true,
                warn: true
            }
        },
        root: $app
    });
};
