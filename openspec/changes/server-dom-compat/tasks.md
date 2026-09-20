# Tasks — server-dom-compat

## 1. Red

- [x] 1.1 Add `jsdom` + `happy-dom` to core devDeps; parameterize the server render tests by window factory (D2); confirm Happy DOM red on the matrix reproducer. Findings: jsdom red too (`url`/location, F4), Happy DOM also red on multi-window scenarios (F2/F3) — artifacts updated to match.

## 2. Fix

- [x] 2.1 F1: read attribute names from `Attr.name` (D1) — reproducer and representative-tree scenarios green under Happy DOM; browser suite unchanged (316/316).
- [x] 2.2 F2: realm-free `nodeType` slot checks in `set-updates-for-paths` (D5) — multi-window text scenario green under Happy DOM.
- [x] 2.3 F3: per-document template cache in `html-parser.ts` (D3) — multi-window custom-element scenario green under Happy DOM; mixed-implementations smoke added and green; full browser suite unchanged (316/316).
- [x] 2.4 F4: location seam (`getLocation()` override, D4) in `lib/dom.ts` + `server.ts` + `router.ts` + `route-link.ts` — `url` scenario green under jsdom; full server suite 50/50; full browser suite unchanged.
- [x] 2.5 **Minor** changeset (lifts the one-per-process rule; uniform `url` contract).

## 3. Docs

- [x] 3.1 Update the "Choosing a DOM implementation" section (README + topic 10, draft re-push): all three implementations verified, one-per-process rule deleted, jsdom direct-`window.location` boundary noted. Topic entry `6f7X7M3M3UIIUzJYqyyKIQ` updated as a draft (v134 over published v132); `options.url` bullet reworded to seam semantics.
