# Design

## Context

The footer is one line in `PageLayout` (`apps/loom/src/app/pages/layout.ts`): `<${PinkContainer} is=${el('footer')}>© 2024</>`. Every route renders through `PageLayout`, both in the prerender pass (linkedom, at build time) and on the client.

Hydration today is swap-based (`client-hydration` spec): the client renders a fresh tree and replaces the served markup. It does not adopt server DOM in place. So whatever the client computes for the year is what the visitor sees after boot, whatever the prerendered HTML said.

## Goals / Non-Goals

**Goals:**

- The year updates itself with no source edit, content publish, or redeploy.
- Every prerender build checks the footer year, so a regression fails the build.

**Non-Goals:**

- A year range (`2024–2026`) or a rights holder name. The notice keeps its current `© <year>` shape.
- The `© 2026` strings in the code examples in `docs/topics/18-pink-composition.md` and `21-pink-layout.md`. They show `PinkContainer` composition, not copyright behavior, and a `new Date()` expression there would only add noise. Leave them as they are.

## Decisions

**Compute the year inside the layout template, at render time.** `© ${new Date().getFullYear()}` in the footer slot. Prerender renders it with the build clock and the client renders it with the visitor's clock. A module-scope constant would also work, since the layout renders once per boot, but putting it in the template keeps the value tied to the render and needs no name. No helper module: it is a single standard-library expression with nothing to wrap or swap.

Alternatives considered:

- _Build-time define (`__BUILD_YEAR__`)_: frozen at deploy, so a site that goes quiet over New Year stays a year behind until the next Contentful publish. That is the same failure as today, just with a shorter lag.
- _Contentful field_: still a manual yearly edit, the thing this change removes.

**Assert the year in the prerender `validate` hook.** `validate` already receives each route's `html`, so `apps/loom/loom.config.ts` checks that every route contains `© <current year></footer>` and throws otherwise. The match is anchored to the closing tag because two docs topics quote the notice in code samples. This puts the "Prerendered pages carry the build year" requirement under a check that runs on every production build, with no new test harness. The app has no browser test suite for `src/`, and adding one for a single expression costs more than it's worth.

## Risks / Trade-offs

- [The served HTML shows last year's number between New Year and the next deploy, until JS boots] → Swap hydration corrects it on boot. Only crawlers and no-JS visitors see the old year, and they see it only until the next deploy. Acceptable.
- [If hydration ever adopts server DOM in place, a text mismatch could leave the old year visible] → That future change has to reconcile text slots that differ from the server value anyway. The client still owns this slot's value, so the footer follows whatever rule that change sets. Nothing to do now.
- [A build that runs across midnight on Dec 31 could render one year and validate another] → Very unlikely, and the failure is a loud build error that a rerun fixes. Not worth guarding.
