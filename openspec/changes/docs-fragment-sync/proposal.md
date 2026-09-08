# Docs Fragment Sync

## Why

The URL fragment and the page's scroll position tell the same story in one direction only: a hash scrolls the page, but scrolling never updates the hash, and the on-page TOC gives no cue for where the reader is. Deep into a topic, the address bar is stale (copy it and you share the top, not where you are) and the TOC is inert as a sense of place (maintainer request, 2026-09-02).

## What Changes

- **Scroll updates the fragment**: as the reader scrolls (either direction), the URL fragment tracks the section currently in view via `history.replaceState` — no history entries, no navigation, no scroll triggered. Scrolled above the first section, the fragment clears.
- **The TOC indicates the active entry**, derived from **one source of truth: the current URL fragment** — the indicator follows the hash however it arrived: initial load, reload, a TOC click, a heading copy-link click (`scroll: false` — hash moves, viewport doesn't, indicator still updates), or the scroll-spy itself.
- One app-level behavior owns the loop: a fragment activity mirrors `location.hash`; the scroll observer and every hash writer update it; the TOC binds its indicator to it.

## Capabilities

### New Capabilities

- `docs-fragment-sync`: the fragment↔position contract — scroll-spy writes (replace-only, cleared above content, suppressed during programmatic scrolls), the hash-derived TOC indicator, and inertness off-browser.

### Modified Capabilities

_None — `spa-routing`'s navigation-scroll contract is untouched; this behavior never scrolls._

## Impact

- `apps/loom` — a fragment-sync module (activity + `IntersectionObserver`), `Toc`/`TopicToc` indicator wiring + styling, docs-layout hookup. Browser-only (`onMounted`), inert under prerender.
- No core changes: `replaceState` outside `route()` doesn't wake the location pipeline (by design — this is reflection, not navigation).
- Sequencing: after `route-scroll-option` lands (its settlement scroll is the main programmatic scroll to suppress around); pairs naturally with `toc-sub-section-links` (indicator covers h3 entries automatically — nearest anchored heading wins) but doesn't require it.
