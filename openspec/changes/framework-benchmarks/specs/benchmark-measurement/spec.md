## ADDED Requirements

### Requirement: DOM operations are timed click-to-forced-layout

For each framework the runner SHALL measure these operations by clicking the contract button and timing, in page, from immediately before the click to the completion of a forced synchronous layout taken after the microtask queue has drained — script, style and layout, with no frame wait: `createRows` (1000), `replaceAll` (1000 over 1000), `partialUpdate` (every 10th of 1000), `selectRow`, `swapRows`, `removeRow`, `clearRows` (1000 → 0), `appendRows` (1000 onto 1000).

#### Scenario: Durations are per op and per framework

- **WHEN** a run completes
- **THEN** every framework has a `Metric` for every listed op id

#### Scenario: Post-operation state is asserted

- **WHEN** an op's sample finishes
- **THEN** the runner checks the resulting DOM (row count, swapped ids, selected class, removed id) and fails the run if the check does not hold

### Requirement: Sampling is repeated, warmed and interleaved

Each op SHALL be measured with 5 discarded warmup samples followed by 15 recorded samples, on a fresh page load per op, with the page brought to the foreground before every sample so Chrome's background-tab throttling never touches a measurement. Across frameworks, sample N for every framework SHALL run before sample N+1 for any framework (round-robin), so no framework consistently runs first.

#### Scenario: Sample counts

- **WHEN** a run completes
- **THEN** every op `Metric.samples` has length 15

#### Scenario: Round-robin order

- **WHEN** the runner logs its progress
- **THEN** consecutive samples alternate frameworks rather than completing one framework before starting the next

#### Scenario: Foreground sampling

- **WHEN** a sample is taken while other frameworks' pages are open
- **THEN** the sampled page is the active tab (`document.hidden` is false) for the duration of the measurement

### Requirement: Startup, memory and bundle size are measured

The runner SHALL record, per framework: `startupMs` as the `bench:ready` performance mark relative to navigation start over 10 fresh loads; `heapBytes` as `JSHeapUsedSize` after `createRows` and a forced garbage collection over 5 samples; `bundle.bytes` as the framework's JS entry output size from the esbuild metafile and `bundle.gzipBytes` as the gzip (level 9) size of that emitted file.

#### Scenario: Bundle sizes exclude shared CSS

- **WHEN** bundle size is recorded
- **THEN** it counts only the framework's JavaScript output

#### Scenario: Memory follows a GC

- **WHEN** a heap sample is taken
- **THEN** `HeapProfiler.collectGarbage` has been invoked after `createRows` and before `Performance.getMetrics`

### Requirement: Results are written as a validated JSON document

The runner SHALL aggregate every metric as `{ median, samples }` and write `results/latest.json` conforming to the `BenchResults` type (`schemaVersion: 1`, `generatedAt`, `environment`, `frameworks[]`), validating the object before writing. The environment SHALL record platform, arch, CPU model, CPU count, memory, Chrome version, Node version and `runner` (`local` | `vercel` | `github`).

#### Scenario: Invalid results are not written

- **WHEN** any sample is non-finite or a required field is missing
- **THEN** the runner exits non-zero and leaves no `latest.json` behind

#### Scenario: Environment is recorded

- **WHEN** a run completes on a Vercel builder
- **THEN** `environment.runner` is `vercel` and `environment.chrome` names the Chromium version that ran

### Requirement: Any failure fails the run

A bundle build error, a DOM assertion failure, a page error or a browser launch failure SHALL exit the runner non-zero with the failing framework and step named.

#### Scenario: Broken implementation

- **WHEN** one framework's page throws during `createRows`
- **THEN** the runner exits non-zero, names the framework and op, and writes no results file

### Requirement: Chrome selection follows the host

The runner SHALL launch puppeteer's bundled Chrome by default and SHALL launch `@sparticuz/chromium` through `puppeteer-core` when `VERCEL` is `1`.

#### Scenario: Local run

- **WHEN** `pnpm bench` runs on a developer machine
- **THEN** puppeteer's Chrome for Testing is launched

#### Scenario: Vercel build

- **WHEN** the bench task runs with `VERCEL=1`
- **THEN** the sparticuz Chromium executable is launched with its recommended args
