// import '@loom-js/pink/pink.css';
// optionally, add icons
// import '@loom-js/pink/icons.css';
import {
    APP_ROOT_ID,
    type AnyComponent,
    type ComponentInputProps,
    type ContextFunction,
    init
} from '@loom-js/core';

// import { usePinkTheming } from '@loom-js/pink';

new EventSource('/esbuild').addEventListener('change', () => location.reload());

// Bootstrap the app onto the shell-owned root.
const bodyBgColor = '0, 0%, 93%';
const $app = document.getElementById(APP_ROOT_ID) as HTMLElement;

$app.style.padding = '0 1.25rem';
$app.innerText = 'loading...';

document.body.classList.add('theme-custom');
document.body.style.setProperty('--p-body-bg-color', bodyBgColor);

export const Bootstrap = (
    page: AnyComponent,
    { style, ...pageProps }: ComponentInputProps = {}
) => {
    // const themeColorHue = 301;

    init({
        app: page({
            ...pageProps,
            style: [
                // usePinkTheming({
                //     avatarBgColor: bodyBgColor,
                //     // colorBorder: `${themeColorHue}, 58%, 36%`,
                //     colorPrimary1: `${themeColorHue}, 58%, 46%`,
                //     colorPrimary2: `${themeColorHue}, 58%, 36%`,
                //     colorPrimary3: `${themeColorHue}, 58%, 26%`
                // }).style,
                style
            ]
        }) as ContextFunction,
        // append: false,
        globalConfig: {
            debug: true,
            debugScope: {
                activity: false,
                creation: false,
                mutations: false,
                updates: false
            }
        },
        root: $app
    });
};
