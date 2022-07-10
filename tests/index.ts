import Chai from 'chai';
// import fs from 'fs';
// import Koa from 'koa';
import puppeteer from 'puppeteer';

import { config } from '../src/config';
// import { directJSHandle } from './support/puppeteer-direct';
// import { Container, ContainerProps } from './support/components/container';
// import { runSetup } from './support/run-setup';

// type KoaServer = ReturnType<typeof app.listen>;
type BoundTestCase = (
    label: string,
    scenario: TestCaseScenario
) => void | Promise<void>;
type BoundTestSetup = (setup: () => void | Promise<void>) => void;
type Suite = (label: string, scenario: SuiteScenario) => void | Promise<void>;
type SuiteScenario = (ctx: TestContext) => void | Promise<void>;
type TestCase = (
    queue: Map<string, TestCaseScenario>,
    label: string,
    scenario: TestCaseScenario
) => void | Promise<void>;
type TestCaseScenario = () => void | Promise<void>;
interface TestContext {
    before: BoundTestSetup;
    page: puppeteer.Page;
    test: BoundTestCase;
}
type TestSetup = (queue: Set<TestSetup>, setup: () => void | Promise<void>) => void;

// Port setup
const defaultTestPort = 4001;
const port = defaultTestPort;

// Tests setup
const { expect } = Chai;

const runTests = async () => {
    // Puppeteer setup
    const browser = await puppeteer.launch({
        // devtools: true,
        headless: false
    });
    const page = await browser.newPage();
    const suiteQueue = new Map<string, () => ReturnType<SuiteScenario>>();

    const before: TestSetup = (queue, setup) => {
        queue.add(setup);
    };
    const suite: Suite = async (label, scenario) => {
        page.on('console', (msg) => console.log(msg.text()));
        // await page.goto(`http://localhost:${port}`, {
        //     waitUntil: 'domcontentloaded'
        // });
        
        if (suiteQueue.has(label)) {
            throw new Error(
                `A suite with the label, ${label}, already exists.`
            );
        }

        const setupQueue = new Set<() => void | Promise<void>>;
        const testQueue = new Map<string, TestCaseScenario>;

        suiteQueue.set(label, async () => {
            console.log('test');
            await scenario({
                before: before.bind(null, setupQueue),
                page,
                test: test.bind(null, testQueue)
            });
            await Promise.all(Array.from(setupQueue.values()).map((setup) => setup()));
            await Promise.all(Array.from(testQueue.entries()).map(([label, testScenario]) => {
                console.info('>>>', label);
                testScenario();
            }));
        });
    };
    const test: TestCase = async (queue, label, scenario) => {
        if (queue.has(label)) {
            throw new Error(`A test with the label, ${label}, already exists.`);
        }

        queue.set(label, scenario);
    };

    console.log('run suite');
    // Test units
    await suite('sample-test', ({ before, page, test }) => {
        before(async () => {
            console.log('* before');
            // const el = await page.$('.test-suite');
            // console.log('-- el', el);
            let win = '';
            // await page.evaluateHandle(winCheck);
            await page.exposeFunction('config', () => {
                config.win = window;
            });
            await page.evaluate(() => {
                window['config']();
            })
            await page.evaluateOnNewDocument(setup);
            // await page.evaluateOnNewDocument(winCheck<ContainerProps>, Container);
            await page.goto(`http://localhost:${port}`, {
                waitUntil: 'domcontentloaded'
            });
            await page.evaluate(() => {
                console.log('evaluate');
                window.document.createElement('div');
                win = window.document.body.textContent || 'no-content';
                console.log('* win', win);
                // winCheck();
            // init({
                //     app: Container({ className: 'app-test' }),
                    // app: window.document.createElement('div'),
                    // onAppMounted: (appNode) => (node = appNode as HTMLElement)
                // });
                // return el instanceof HTMLElement;
            });
            // console.log('* el', el);
        });

        test('should pass', async () => {
            const $el = await page.$eval('.test-suite', (el) => el.textContent);

            console.log('$el', $el);
            expect($el).to.contain('Hello World!');

            // server.close();
            // process.exit(0);
        });
    });

    console.log('run suite queue', suiteQueue.size);

    // Run the tests.
    Array.from(suiteQueue.entries()).forEach(([label, scenario]) => {
        console.info('+++', label);
        scenario();
    });
};

// Koa (server) setup
// const app = new Koa();
// let server: KoaServer;

// app.use(async (ctx) => {
//     ctx.body = '<div class="test-suite">Hello World!</div>';
//     console.log('ctx.body', ctx.body);
//     console.log('ctx.type', ctx.type);
// });
// server = app.listen(port);

runTests();
