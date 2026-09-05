# Fix SSR Region Null Text

## Why

Under `renderToString`, every compiled component-element region — the `children` region and each provided named-slot region — serializes with a stray literal `null` text node ahead of its content: `<${Card}><p>B</p></>` serializes `<div>null<p>B</p></div>`. Browser rendering is clean (the element-syntax suites assert exact DOM), so this is a server/client parity break — found 2026-09-05 while verifying template-comment behavior. It must land before `server-first-loom-app`: prerendered pages would otherwise ship visible "null"s wherever element-syntax children are used (the docs app's layout uses them), and hydration would correct DOM it should have matched.

Characterization (node + linkedom):

- `${null}` / `${undefined}` / `${false}` text slots → empty, per contract (not a nullish-text bug).
- `${children}` from a component-element children region → `null` + content.
- `${slots?.name}`, region provided → `null` + content; region absent → empty (correct).

## What Changes

- Core's server render path serializes compiled children/slot regions without artifacts — output identical to the browser's rendering of the same template.
- Regression coverage in the server suite: element-syntax children and named-slot regions are currently untested under `renderToString` (the existing server tests exercise routes and plain templates, which is why this went unseen).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `server-rendering`: the string-render requirement gains an explicit scenario — compiled component-element regions (children, named slots) serialize byte-identical to the browser render, with no artifact nodes.

## Impact

- `packages/core/src` — the region/fragment render path under the injected window (root cause TBD at apply; suspicion: the synthesized region component's fragment handling stringifying a nullish placeholder server-side).
- `packages/core/tests/server` — new region-serialization tests; possibly a browser spec if the fix touches shared code.
- Published: `@loom-js/core` **patch** changeset.
- Sequencing: before `server-first-loom-app`'s prerender phase runs against real pages.
