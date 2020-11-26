import { JSDOM } from 'jsdom';

import { Framework } from '../../src/framework';

export const NectarTestApp = () => {
    const { appId } = {
        appId: 'app'
    };
    const htmlDoc = `
            <!DOCTYPE html>
            <html lang="en">
              <body id="${appId}">
              </body>
            </html>
        `;
    const window = new JSDOM(htmlDoc).window;
    const document = window.document;
    const app = new Framework({
        config: { global: window as any },
        rootNode: document.getElementById(appId)
    });

    return {
        app,
        document,
        window
    };
};
