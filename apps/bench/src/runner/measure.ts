// Drives each built page through the DOM contract and times it. Every op is
// measured from just before the click to a forced synchronous layout after
// the microtask queue drains — script + style + layout, with no vsync idle
// and the same bias for every framework.
import type { Browser, Page } from 'puppeteer-core';

import {
    BUTTONS,
    CLASSES,
    READY_MARK,
    ROW_COUNTS
} from '../shared/contract.ts';
import type { FrameworkId, Metric, OpId } from '../types.ts';
import type { BuiltFramework } from './build.ts';
import { roundRobin, toMetric } from './stats.ts';

export const SAMPLES = {
    opWarmup: 5,
    ops: 15,
    startup: 10,
    heap: 5
} as const;

interface PageState {
    rowCount: number;
    ids: number[];
    selectedId: number | undefined;
}

// Runs in the page: a snapshot of what the table shows. Serialized into the
// page, so the contract's class names arrive as an argument.
const readState = (classes: { row: string; selected: string }): PageState => {
    const rows = Array.from(document.querySelectorAll(`tr.${classes.row}`));
    const selected = document.querySelector(
        `tr.${classes.row}.${classes.selected}`
    );

    return {
        rowCount: rows.length,
        ids: rows.map((row) => Number(row.firstElementChild?.textContent)),
        selectedId: selected
            ? Number(selected.firstElementChild?.textContent)
            : undefined
    };
};

// Runs in the page: times one click.
const timeClick = async (selector: string): Promise<number> => {
    const target = document.querySelector(selector) as HTMLElement | null;

    if (!target) {
        throw new Error(`no element matches ${selector}`);
    }

    const tbody = document.querySelector('tbody') as HTMLElement;
    const start = performance.now();

    target.click();

    // Frameworks that flush in a microtask (vue, svelte) commit here; the
    // sync ones already have. Still inside the click's task — no frame yet.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // Force style + layout so the measurement includes them.
    tbody.getBoundingClientRect();

    return performance.now() - start;
};

const click = async (page: Page, selector: string) => {
    await page.evaluate(timeClick, selector);
};

const state = (page: Page) =>
    page.evaluate(readState, { row: CLASSES.row, selected: CLASSES.selected });

const rowSelector = (index: number, className: string) =>
    `tr.${CLASSES.row}:nth-child(${index + 1}) .${className}`;

const ensureRows = async (page: Page, count: number) => {
    if ((await state(page)).rowCount !== count) {
        await click(page, `#${BUTTONS.run}`);
    }
};

interface OpDefinition {
    /** Untimed: put the page in the state the op starts from. */
    prepare: (page: Page) => Promise<void>;
    /** The selector the timed click lands on. */
    target: (before: PageState) => string;
    /** Throws when the page is not in the state the op must leave it in. */
    assert: (before: PageState, after: PageState) => void;
}

const expect = (condition: boolean, message: string) => {
    if (!condition) {
        throw new Error(message);
    }
};

const OPS: Record<OpId, OpDefinition> = {
    createRows: {
        prepare: async (page) => {
            if ((await state(page)).rowCount) {
                await click(page, `#${BUTTONS.clear}`);
            }
        },
        target: () => `#${BUTTONS.run}`,
        assert: (_before, after) =>
            expect(
                after.rowCount === ROW_COUNTS.run,
                `expected ${ROW_COUNTS.run} rows, saw ${after.rowCount}`
            )
    },
    replaceAll: {
        prepare: (page) => ensureRows(page, ROW_COUNTS.run),
        target: () => `#${BUTTONS.run}`,
        assert: (before, after) =>
            expect(
                after.rowCount === ROW_COUNTS.run &&
                    after.ids[0] !== before.ids[0],
                'expected 1000 fresh rows'
            )
    },
    partialUpdate: {
        prepare: (page) => ensureRows(page, ROW_COUNTS.run),
        target: () => `#${BUTTONS.update}`,
        assert: (_before, after) =>
            expect(
                after.rowCount === ROW_COUNTS.run,
                'row count changed on update'
            )
    },
    selectRow: {
        prepare: (page) => ensureRows(page, ROW_COUNTS.run),
        // Alternate rows so every sample changes the selection.
        target: (before) =>
            rowSelector(
                before.selectedId === before.ids[1] ? 2 : 1,
                CLASSES.labelLink
            ),
        assert: (before, after) =>
            expect(
                after.selectedId !== undefined &&
                    after.selectedId !== before.selectedId,
                'selection did not move'
            )
    },
    swapRows: {
        prepare: (page) => ensureRows(page, ROW_COUNTS.run),
        target: () => `#${BUTTONS.swapRows}`,
        assert: (before, after) =>
            expect(
                after.ids[1] === before.ids[998] &&
                    after.ids[998] === before.ids[1],
                'rows 1 and 998 did not swap'
            )
    },
    removeRow: {
        prepare: async (page) => {
            if (
                (await state(page)).rowCount <
                ROW_COUNTS.run - SAMPLES.ops - SAMPLES.opWarmup
            ) {
                await click(page, `#${BUTTONS.run}`);
            }
        },
        target: () => rowSelector(1, CLASSES.remove),
        assert: (before, after) =>
            expect(
                after.rowCount === before.rowCount - 1 &&
                    !after.ids.includes(before.ids[1] as number),
                'row 1 was not removed'
            )
    },
    clearRows: {
        prepare: (page) => ensureRows(page, ROW_COUNTS.run),
        target: () => `#${BUTTONS.clear}`,
        assert: (_before, after) =>
            expect(
                after.rowCount === 0,
                `expected 0 rows, saw ${after.rowCount}`
            )
    },
    appendRows: {
        prepare: async (page) => {
            // Always re-create, so each sample appends onto exactly 1,000.
            await click(page, `#${BUTTONS.run}`);
        },
        target: () => `#${BUTTONS.add}`,
        assert: (_before, after) =>
            expect(
                after.rowCount === ROW_COUNTS.run + ROW_COUNTS.add,
                `expected 2000 rows, saw ${after.rowCount}`
            )
    }
};

export interface FrameworkMeasurements {
    startupMs: Metric;
    heapBytes: Metric;
    ops: Record<OpId, Metric>;
}

const failWith = (framework: FrameworkId, step: string, error: unknown) =>
    new Error(
        `[bench] ${framework} / ${step}: ${error instanceof Error ? error.message : String(error)}`
    );

const openPage = async (
    browser: Browser,
    origin: string,
    built: BuiltFramework
): Promise<Page> => {
    const page = await browser.newPage();
    const errors: string[] = [];

    page.on('pageerror', (error: unknown) =>
        errors.push(error instanceof Error ? error.message : String(error))
    );
    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(message.text());
        }
    });

    await page.goto(`${origin}${built.pagePath}`, { waitUntil: 'load' });
    await page.waitForFunction(
        (mark: string) => performance.getEntriesByName(mark).length > 0,
        { timeout: 15000 },
        READY_MARK
    );

    if (errors.length) {
        throw new Error(`page errors — ${errors.join('; ')}`);
    }

    // Surface later errors on the next assertion instead of silently.
    (page as Page & { benchErrors?: string[] }).benchErrors = errors;

    return page;
};

const assertNoPageErrors = (page: Page) => {
    const errors =
        (page as Page & { benchErrors?: string[] }).benchErrors ?? [];

    if (errors.length) {
        throw new Error(`page errors — ${errors.join('; ')}`);
    }
};

const sampleOp = async (page: Page, op: OpDefinition): Promise<number> => {
    // Several pages stay open per op; Chrome throttles the background ones
    // hard (10x slower, noisy), so each sample runs in the foreground tab.
    await page.bringToFront();
    await op.prepare(page);

    const before = await state(page);
    const duration = await page.evaluate(timeClick, op.target(before));
    const after = await state(page);

    op.assert(before, after);
    assertNoPageErrors(page);

    if (!Number.isFinite(duration)) {
        throw new Error(`non-finite duration ${String(duration)}`);
    }

    return duration;
};

/**
 * Times every op for every built framework: one page per framework per op,
 * warmups first, then recorded samples in round-robin order across the
 * frameworks so no framework always runs first.
 */
export const measureOps = async (
    browser: Browser,
    origin: string,
    frameworks: BuiltFramework[]
): Promise<Map<FrameworkId, Record<OpId, Metric>>> => {
    const results = new Map<FrameworkId, Partial<Record<OpId, Metric>>>(
        frameworks.map(({ spec }) => [spec.id, {}])
    );

    for (const [opId, op] of Object.entries(OPS) as Array<
        [OpId, OpDefinition]
    >) {
        const pages = new Map<FrameworkId, Page>();
        const samples = new Map<FrameworkId, number[]>();

        try {
            for (const built of frameworks) {
                try {
                    pages.set(
                        built.spec.id,
                        await openPage(browser, origin, built)
                    );
                    samples.set(built.spec.id, []);

                    for (
                        let warmup = 0;
                        warmup < SAMPLES.opWarmup;
                        warmup += 1
                    ) {
                        await sampleOp(pages.get(built.spec.id) as Page, op);
                    }
                } catch (error) {
                    throw failWith(built.spec.id, `${opId} (warmup)`, error);
                }
            }

            for (const { subject } of roundRobin(frameworks, SAMPLES.ops)) {
                try {
                    samples
                        .get(subject.spec.id)
                        ?.push(
                            await sampleOp(
                                pages.get(subject.spec.id) as Page,
                                op
                            )
                        );
                } catch (error) {
                    throw failWith(subject.spec.id, opId, error);
                }
            }

            for (const [frameworkId, recorded] of samples) {
                (results.get(frameworkId) as Partial<Record<OpId, Metric>>)[
                    opId
                ] = toMetric(recorded);
            }

            console.info(
                `> ${opId}: ${frameworks
                    .map(
                        ({ spec }) =>
                            `${spec.id} ${results.get(spec.id)?.[opId]?.median.toFixed(2)}ms`
                    )
                    .join(' · ')}`
            );
        } finally {
            await Promise.all(
                Array.from(pages.values()).map((page) => page.close())
            );
        }
    }

    return new Map(
        Array.from(results.entries()).map(([frameworkId, ops]) => [
            frameworkId,
            ops as Record<OpId, Metric>
        ])
    );
};

/** Startup: the `bench:ready` mark relative to navigation start, fresh page per sample. */
export const measureStartup = async (
    browser: Browser,
    origin: string,
    built: BuiltFramework
): Promise<Metric> => {
    const samples: number[] = [];

    for (let sample = 0; sample < SAMPLES.startup; sample += 1) {
        const page = await openPage(browser, origin, built).catch(
            (error: unknown) => {
                throw failWith(built.spec.id, 'startup', error);
            }
        );

        try {
            samples.push(
                await page.evaluate(
                    (mark: string) =>
                        performance.getEntriesByName(mark)[0]?.startTime ?? NaN,
                    READY_MARK
                )
            );
        } finally {
            await page.close();
        }
    }

    if (samples.some((value) => !Number.isFinite(value))) {
        throw failWith(
            built.spec.id,
            'startup',
            new Error('ready mark missing')
        );
    }

    return toMetric(samples);
};

/** Heap after 1,000 rows and a forced GC, fresh page per sample. */
export const measureHeap = async (
    browser: Browser,
    origin: string,
    built: BuiltFramework
): Promise<Metric> => {
    const samples: number[] = [];

    for (let sample = 0; sample < SAMPLES.heap; sample += 1) {
        const page = await openPage(browser, origin, built).catch(
            (error: unknown) => {
                throw failWith(built.spec.id, 'heap', error);
            }
        );

        try {
            await click(page, `#${BUTTONS.run}`);

            const session = await page.createCDPSession();

            await session.send('HeapProfiler.enable');
            await session.send('HeapProfiler.collectGarbage');
            await session.send('Performance.enable');

            const { metrics } = await session.send('Performance.getMetrics');
            const heap = metrics.find(
                ({ name }) => name === 'JSHeapUsedSize'
            )?.value;

            if (heap === undefined) {
                throw new Error(
                    'JSHeapUsedSize missing from Performance.getMetrics'
                );
            }

            samples.push(heap);
            await session.detach();
        } catch (error) {
            throw failWith(built.spec.id, 'heap', error);
        } finally {
            await page.close();
        }
    }

    return toMetric(samples);
};
