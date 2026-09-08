# Tasks — docs-fragment-sync

## 1. Gate

- [ ] 1.1 Confirm `route-scroll-option` has landed (the settlement/top scrolls are the programmatic scrolls D3 suppresses around)

## 2. Behavior module

- [ ] 2.1 `activeFragment` activity + hash mirroring (route/location watchers, `popstate`/`hashchange`), app-level module
- [ ] 2.2 Scroll observer per D2 (IO over anchored headings, last-above-threshold, clear-above-first, bottom-of-page override) writing `replaceState` + the activity; lifecycle on the topic view's mount/unmount
- [ ] 2.3 Suppression per D3 (`scrollend` with debounce fallback) with the destination hash still applied through D1

## 3. TOC indicator

- [ ] 3.1 `Toc` `activeId` input → active class + `aria-current="location"`; `TopicToc` binds it to `activeFragment`; module CSS

## 4. Verification

- [ ] 4.1 Live pass on a long topic: scroll both directions (URL tracks, replace-only — history length constant), above-first clears, bottom activates the last entry
- [ ] 4.2 Hash-arrival matrix: load-with-hash, reload, back/forward, TOC click (no thrash mid-smooth-scroll), copy-link with `scroll: false` (indicator moves, viewport doesn't)
- [ ] 4.3 Prerender parity: `renderToString` markup identical to pre-scroll browser render; no observer work off-browser
- [ ] 4.4 `pnpm -F @loom-js/loom type-check`; `pnpm format`
