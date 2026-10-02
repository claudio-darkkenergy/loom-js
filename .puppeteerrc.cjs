// Vercel's builder runs the bench task on `@sparticuz/chromium`, so the
// Chrome puppeteer would otherwise download at install time is never used
// there. Everywhere else the bundled Chrome is what `pnpm bench` and the core
// tests launch. Firefox is never used.
const onVercel = process.env.VERCEL === '1';

module.exports = {
    chrome: { skipDownload: onVercel },
    'chrome-headless-shell': { skipDownload: onVercel },
    firefox: { skipDownload: true }
};
