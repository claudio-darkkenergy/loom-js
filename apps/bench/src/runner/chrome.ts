// Launches the browser the host can run: puppeteer's bundled Chrome
// locally; `@sparticuz/chromium` on Vercel, whose builder lacks Chrome's
// shared libraries.
import type { Browser } from 'puppeteer-core';

import type { BenchEnvironment } from '../types.ts';

export const detectRunner = (): BenchEnvironment['runner'] =>
    process.env.VERCEL === '1'
        ? 'vercel'
        : process.env.GITHUB_ACTIONS === 'true'
          ? 'github'
          : 'local';

const LAUNCH_ARGS = [
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage'
];

export const launchBrowser = async (): Promise<Browser> => {
    if (detectRunner() === 'vercel') {
        const [{ default: chromium }, { launch }] = await Promise.all([
            import('@sparticuz/chromium'),
            import('puppeteer-core')
        ]);

        return launch({
            args: [...chromium.args, ...LAUNCH_ARGS],
            executablePath: await chromium.executablePath(),
            headless: true
        });
    }

    const { launch } = await import('puppeteer');

    return launch({ args: LAUNCH_ARGS, headless: true }) as Promise<Browser>;
};
