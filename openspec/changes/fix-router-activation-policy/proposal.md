## Why

`Router.route()` preserves native browser intent for ctrl/cmd-clicks (new tab) but not for **shift-clicks** (new window) or **alt-clicks** (download): those fall through to `preventDefault()` + `pushState`, hijacking the user's explicit ask into an in-place SPA navigation. Found and filed during `add-core-element-components` task 0.3 (its design Findings), where `RouteLink`'s design ruled that activation policy belongs in the router, not in a second layer above it. Fixing it touches `packages/core/src/router.ts`, which carries an open 🟡 SRP entry in `SOLID-AUDIT-REPORT.md` — the repo's audit rule folds that resolution into this change.

## What Changes

- **Activation policy**: the `route()` early return generalizes from `ctrlKey || metaKey` to all modified activations — `ctrlKey`, `metaKey`, `shiftKey`, `altKey` — plus events something else already `preventDefault()`ed. Middle-clicks need nothing (they fire `auxclick`, never `click`).
- **Router SRP refactor** (audit `packages/core/src/router.ts` 🟡): the private matching/param/validation logic extracts into focused helpers per the audit entry's recommended fix — no public API change, no behavior change.
- **Audit entry** flips to ✅ Resolved.

Non-goals: the deprecated `onRoute` in `routing.ts` (lacks even the ctrl/meta check; it is deprecated and unused by first-party code paths that matter — documented, not patched); any route-matching/param behavior change; active-state affordances.

## Capabilities

### New Capabilities

- `spa-routing`: a deliberately narrow first spec for the router — the link-activation policy (which activations the SPA router may claim and which must fall through to the browser). Route matching, params, and lazy page loading remain unspecced until a future change widens this capability.

### Modified Capabilities

<!-- None. -->

## Impact

- **Code:** `packages/core/src/router.ts` (guard + internal refactor); new spec file under `packages/core/tests/unit/`; `SOLID-AUDIT-REPORT.md`.
- **Risk:** Low — the fix is additive to an early return; the refactor is internal with the full suite as the net. Byte budget set in tasks section 0.
- **Release:** Patch changeset for `@loom-js/core`.
