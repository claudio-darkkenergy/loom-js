import * as path from 'path';
import puppeteer from 'puppeteer';

export interface PrerenderOptions {
    port?: number | string;
    routes?: string[];
    waitFor?: number | string | (() => boolean);
    waitForManual?: boolean;
    waitUntil?: 'domcontentloaded' | 'load' | 'networkidle0' | 'networkidle2';
}

export interface PrerenderOutput {
    html: string;
    route: string;
}

/**
 * Prerenders one or more pages based on provided routes using Puppeteer.
 * @param options PrerenderOptions
 * @returns A promise of the prerendered HTML string
 *
 * @example waitForTimeout `waitFor: 3000`
 * @example waitForSelector `waitFor: '#app'`
 * @example waitForFunction `waitFor: () => !!window.APP_READY`
 *      To manually trigger:
 *      @usage `window.APP_READY = true;`
 * @example `waitForManual: true`
 *      When this is set, `waitFor` will be ignored. This expects a manual trigger of the prerender snapshot from the client code.
 *      This is great for waiting for async resolution & enrichment of content to the page.
 *      To manually Trigger:
 *      @usage `if (window.snapshot) window.snapshot();`
 */
export async function prerender({
    port = process.env.PORT || 8080,
    routes = ['/'],
    waitFor,
    waitForManual = false,
    waitUntil = 'domcontentloaded'
}: PrerenderOptions) {
    const browser = await puppeteer.launch({ headless: true });
    const render = async (route = '/') => {
        const page = await browser.newPage();
        let output: PrerenderOutput;

        await page.goto(path.join(`http://localhost:${port}`, route), {
            waitUntil
        });

        if (waitFor || waitForManual) {
            if (waitForManual === true) {
                await page.waitForFunction(
                    () =>
                        new Promise<boolean>((resolve) => {
                            (window as any).snapshot = () => {
                                resolve(true);
                            };
                        })
                );
            } else if (typeof waitFor === 'number') {
                page.waitForTimeout(waitFor);
            } else if (typeof waitFor === 'string') {
                await page.waitForSelector(waitFor);
            } else if (typeof waitFor === 'function') {
                await page.waitForFunction(waitFor);
            }
        }

        // Serialized HTML
        output = { route, html: await page.content() };
        page.close();
        return output;
    };
    const renderedPages = await Promise.all(routes.map(render));

    await browser.close();
    return renderedPages;
}
