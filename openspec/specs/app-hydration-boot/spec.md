# app-hydration-boot Specification

## Purpose

Defines the loom app's client boot contract: one boot path for every environment — prime the resource cache from the embedded state when present, then `hydrate` onto the shell-owned root. Prerendered pages take over flash-free with no first-render network; shells without markup mount immediately and render progressively.

Established by the `server-first-loom-app` change (2026-09-15).

## Requirements

### Requirement: The app boots by priming then hydrating

The loom app SHALL boot via `hydrate` onto the shell-owned root element, priming the resource cache from the embedded state script (when present) before the boot call. The boot path SHALL NOT create the root element, write placeholder text, or wipe served markup pre-swap.

#### Scenario: Primed boot skips the network

- **WHEN** a prerendered page with an embedded state script boots
- **THEN** `primeResources` runs before `hydrate`, and the first render's resource-backed fetches resolve from the primed cache with no network requests

#### Scenario: No flash on takeover

- **WHEN** the client hydrates a prerendered route
- **THEN** the served markup remains visible and untouched until the single settle-gated swap — no "loading…" text, no skeleton flash, no visible re-render

### Requirement: One boot path degrades gracefully without prerendered markup

The same boot code SHALL serve every environment: an empty root (dev server, SPA-fallback shell) hydrates via the documented empty-root degradation with no dev-only fork of the bootstrap.

#### Scenario: Dev server boot

- **WHEN** the app boots from the dev server's empty shell (no markup, no state script)
- **THEN** `hydrate` mounts the empty root immediately and renders progressively — the loading skeleton paints while data is pending, as it did under `init` — with no separate `init` code path

#### Scenario: Fallback shell boot

- **WHEN** an unknown route serves the SPA-fallback shell in production
- **THEN** the app boots, routes client-side, and renders the requested content
