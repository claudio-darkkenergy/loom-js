// What the numbers were measured on — recorded next to them.
import type { Browser } from 'puppeteer-core';

import type { BenchEnvironment } from '../types.ts';
import { detectRunner } from './chrome.ts';
import os from 'node:os';

export const captureEnvironment = async (
    browser: Browser
): Promise<BenchEnvironment> => ({
    arch: os.arch(),
    chrome: await browser.version(),
    cpuModel: os.cpus()[0]?.model.trim() ?? 'unknown',
    cpus: os.cpus().length,
    memoryGb: Math.round(os.totalmem() / 1024 ** 3),
    node: process.version,
    platform: os.platform(),
    runner: detectRunner()
});
