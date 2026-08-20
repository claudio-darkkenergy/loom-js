# diagnostic-logging Specification

## Purpose

Defines the framework's console surface (`loomConsole`): warnings and errors always pass through to the native console with true call-site attribution, non-warning narration is opt-in behind named debug scopes (`setDebug` + `canDebug('<scope>')`) and silent by default, and hot-path narration collapses into per-cycle console groups. The gate costs one property-access check when channels are off.

Established by the `improve-loom-console` change (2026-08-18).

## Requirements

### Requirement: Warnings and errors always surface

The framework console (`loomConsole`) SHALL pass `warn` and `error` calls through to the native console unconditionally — independent of the debug configuration and of `NODE_ENV`. Framework call sites SHALL NOT add their own debug guard in front of a `warn` or `error` call.

#### Scenario: Warning surfaces with debug off

- **WHEN** a framework warning fires (e.g. a `style` value that is not an object literal, or a settlement `maxWait` expiry) and the app has never called `setDebug`
- **THEN** the warning appears on the native console

#### Scenario: Warning surfaces in a production build

- **WHEN** the same warning fires with `NODE_ENV=production` (e.g. during an SSG run)
- **THEN** the warning appears on the native console

### Requirement: Debug channels are opt-in, scoped, and silent by default

Non-warning console methods routed through `loomConsole` SHALL emit only when debug logging is enabled (`setDebug`) in a non-production environment; with debug off they SHALL resolve to a no-op. Debug call sites SHALL be guarded by a named scope (`canDebug('<scope>')` — e.g. `updates`, `mutations`, `activity`, `creation`) at the call site; there SHALL be no additional global `console` scope gating the sink itself.

#### Scenario: Silent by default

- **WHEN** the app never calls `setDebug` and framework internals run render, mount, and update cycles
- **THEN** no info/log/group messages reach the native console

#### Scenario: Enabling a scope emits that scope's narration

- **WHEN** `setDebug(true, { updates: true })` is active in a non-production build
- **THEN** update-cycle narration emits, and call sites guarded by other scopes stay silent

### Requirement: Console messages attribute to their call site

A message emitted through `loomConsole` SHALL be attributed by the browser console to the framework call site that produced it, not to the `loomConsole` module. Accessing a method SHALL return either a native console method bound to the console (gate open) or a no-op (gate closed) — never a wrapper closure that intercepts the call.

#### Scenario: DevTools source link points at the caller

- **WHEN** `loomConsole.warn(…)` is called from `get-attr-update.ts` in a browser
- **THEN** the console entry's source location is the `get-attr-update.ts` call site (as bundled), not `loom-console.ts`

#### Scenario: Gate state is read at access time

- **WHEN** debug is toggled between two `loomConsole.info(…)` call-site invocations
- **THEN** each invocation reflects the gate state at its own property access

### Requirement: Hot-path narration collapses

Per-value debug narration that emits once per reconciled value per render cycle (the reactive-update "should update" detail) SHALL be nested under a collapsed console group per cycle, consistent with the existing `loom (Updating…)`/`loom (Mounting…)`/`loom (Mutating…)` groups.

#### Scenario: Update narration is grouped, not flat

- **WHEN** the `updates` scope is enabled and a render cycle reconciles many reactive values
- **THEN** the per-value detail lines appear inside a collapsed group for that cycle rather than as top-level console lines
