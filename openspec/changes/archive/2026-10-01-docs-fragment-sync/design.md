# Design — docs-fragment-sync

## Context

Anchored headings carry ids (`headingAnchorId`; h3s join via `toc-sub-section-links`). The router owns navigation scrolls (`route-scroll-option`: settlement-gated fragment scroll, top scroll, `scroll: false`); same-page hash navigation is deliberately quiet on the activity pipeline, and `replaceState` fires no `popstate` — so there is no existing reactive hash signal, and this feature must not create navigations.

## Goals / Non-Goals

**Goals:** address bar always shareable mid-read; TOC as a sense of place; one hash-derived indicator regardless of how the hash arrived; zero interference with the router's scroll contract.

**Non-Goals:** history entries per section (replace-only); scrolling anything (pure reflection); core changes; per-scroll analytics; persisting reading position.

## Decisions

### D1 — One activity, hash-anchored

An app-level `activeFragment` activity mirrors `location.hash`. Writers: the scroll observer (which also `replaceState`s the URL), the docs layout's route/location watchers (initial load, topic changes, copy-link and TOC clicks — read the hash after each), and `popstate`/`hashchange` listeners for traversal. The TOC indicator `bind`s to it — never to scroll position directly — which is what makes the behavior hash-derived: any writer, same indicator.

### D2 — IntersectionObserver spy, replace-only, clear-above-first

An `IntersectionObserver` over the topic's anchored headings (rootMargin biasing the top ~third of the viewport) resolves the current section: the last heading above the threshold. On change: `replaceState` the new hash (or strip it when above the first heading) and update the activity. `replaceState` keeps back/forward meaningful (entries are per-navigation, not per-scroll) and never wakes core's location pipeline. Observer lifecycle rides the topic view's `onMounted`/`onUnmounted`; re-arms per topic render (headings are per-topic).

### D3 — Suppression during programmatic scrolls

The router's deferred scrolls (settlement fragment scroll, top scroll) and TOC/copy-link smooth scrolls pass intermediate headings; the spy must not rewrite the hash mid-flight. Rule: after any hash-bearing navigation or TOC activation, the spy holds until the scroll settles (`scrollend` where available, debounce fallback) before resuming. The held state still accepts the _destination_ hash via D1's watchers, so the indicator moves immediately even while the viewport is traveling.

### D4 — Indicator styling is TOC-local

`Toc` gains an `activeId` reactive input; the matching entry gets an active class (module CSS: accent + weight), `aria-current="location"` for AT parity. No pink change — this is app chrome; promote later if a second consumer appears.

## Risks / Trade-offs

- [Observer thresholds feel wrong on short final sections] → the last-heading-above-threshold rule plus a bottom-of-page override (at scroll end, the last section is active) — verified in 4.x against real topics.
- [Spy vs. smooth scroll races] → D3's hold; the settle signal is the scroll, not a timer guess, where `scrollend` exists.
- [`replaceState` churn] → only on section _change_, not per scroll frame; a section change is at most a few per screenful.

## Migration Plan

App-only, additive; ships dark until the docs layout wires it. Rollback is unhooking the module.

## Open Questions

None.
