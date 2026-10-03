# benchmarks-page Specification

## Purpose

TBD - created by archiving change framework-benchmarks. Update Purpose after archive.

## Requirements

### Requirement: `/benchmarks` is a routed, header-linked page

The loom app SHALL serve a `/benchmarks` route (`RoutePath.Benchmarks`) as a lazily imported page module with its own route scope, and the site header SHALL link to it.

#### Scenario: Header link navigates client-side

- **WHEN** a visitor on `/` clicks the header's Benchmarks link
- **THEN** the router renders the benchmarks page without a full page load

#### Scenario: Route shell exists

- **WHEN** the production build completes
- **THEN** a `/benchmarks` shell is emitted with its own route-scoped assets, like `/docs`

### Requirement: Results load as a resource with dehydrated state

The page SHALL read its data from a `bench:results` resource that fetches `/static/bench/latest.json`, the file the loom build copies from `apps/bench/results/latest.json`. When the route is loaded directly, the resource SHALL hydrate from the page's state script without a network request.

#### Scenario: Direct load hydrates

- **WHEN** `/benchmarks` is opened directly in production
- **THEN** the measured values render from the embedded state and no request for `latest.json` is made

#### Scenario: SPA navigation fetches

- **WHEN** a visitor navigates from `/` to `/benchmarks`
- **THEN** `/static/bench/latest.json` is fetched once and the page renders from it

### Requirement: Operations are compared absolutely and relative to vanilla

The page SHALL show a DOM-operations table with one row per op and one column per framework, vanilla first and the rest ordered by the geometric mean of their vanilla-relative ratios; each cell SHALL show the median in ms and the ratio to vanilla, and a final row SHALL show each framework's geometric mean ratio.

#### Scenario: Ratios computed from medians

- **WHEN** vanilla's `createRows` median is 40 ms and loom's is 60 ms
- **THEN** loom's `createRows` cell reads 60 ms and 1.50×

#### Scenario: Column order

- **WHEN** the table renders
- **THEN** the first framework column is vanilla and the remaining columns ascend by geometric mean ratio

### Requirement: Bundle size, startup and memory are shown

The page SHALL show each framework's gzip and raw bundle size as proportional bars, and startup time and heap after 1k rows as tables with the same ×vanilla treatment.

#### Scenario: Bars are proportional

- **WHEN** one framework's gzip size is twice another's
- **THEN** its bar is twice as long

### Requirement: The page states its provenance and method

The page SHALL show the run's day (`generatedDate`, the run's day in the westernmost time zone, formatted without any time-zone conversion), `environment` (CPU, memory, Chrome, runner) and every framework's measured version, and SHALL include a Methodology section describing the click-to-settled-frame timing, sampling counts and what the method does not capture, with a link to the `apps/bench` source.

#### Scenario: Caption matches the data

- **WHEN** the page renders results generated on a given date with given versions
- **THEN** the caption shows that date and those exact versions

### Requirement: Copy follows the docs voice

Page copy SHALL be plain, direct sentences with no promotional framing and no AI-style metaphors.

#### Scenario: Copy review

- **WHEN** the page copy is reviewed
- **THEN** it contains no words from the banned list in the repo's writing rules and makes no claim the table does not show
