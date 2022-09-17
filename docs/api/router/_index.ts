import { VercelRequest, VercelResponse } from '@vercel/node';
import * as path from 'path';
import puppeteer from 'puppeteer';

const route = async (req: VercelRequest, res: VercelResponse) => {
    const { headers, query, url } = req;
    const host =
        process.env.HOST ||
        (headers['x-forwarded-host'] as string) ||
        headers.host;
    const browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });
    console.log('route query', query);
    const page = await browser.newPage();
    page.on('console', (msg) => {
        console.log('>>> LOG:', msg.text());
    });
    await page.goto(path.join(host, query.path as string), {
        waitUntil: 'domcontentloaded'
    });
    console.log('waiting for function');
    await page.waitForFunction(
        () =>
            new Promise<boolean>((resolve) => {
                (window as any).snapshot = () => {
                    resolve(true);
                };
            })
    );
    const html = await page.content();
    page.close();

    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
    res.setHeader('Content-Type', 'text/html');
    res.status(200);
    res.send(html);
};

export default route;
