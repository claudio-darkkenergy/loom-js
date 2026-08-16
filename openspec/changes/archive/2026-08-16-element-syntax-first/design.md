## Context

See `openspec/changes/archive/2026-08-07-add-named-slots/design.md` for the mechanism this direction rests on (markup compiling to synthesized-component values) and the two composition-path findings that motivate shrinking the value-composition surface: fragment-rooted values in children arrays stringify (open limitation), and the two latent fragment bugs both lived on paths that markup composition avoids.

## Decisions (settled in the 2026-08-07 explore session)

### Decision 1: "Primary," not "required"

The functional form is the compile target and the semantic model; element syntax is sugar over it. Therefore the promotion is an authoring-surface policy — docs lead with markup, pink and the app author in markup, an optional lint package enforces it for teams — never a runtime restriction.

### Decision 2: Survivors live in core, tree-shakeable

Pink is one UI kit of possible many; kit-agnostic components may not live there. `RouteLink` belongs in core because core owns the router — and it is designed fresh (wiring `route()` internally) rather than porting tags' `Link` (which only defaulted `href`/`target` and plumbed `onClick`). Media utilities (`Svg`, `Picture`, `ResponsiveImage`, `Source`) move to core as presentational primitives. Each addition follows the `defineElement` precedent: imported by path or tree-shakeable export, with a byte budget.

### Decision 3: Enforcement ships as a lint package; the repo stays prettier-only

Eslint rules as enforcers (e.g. "no `${Component({…})}` interpolation where element syntax serves", "no `@loom-js/tags` imports"), published like the esbuild plugin is. Not codemods — no external users exist; the in-repo migration is done by hand. Biome: GritQL plugin expressing the same patterns, lint-only (no fix support), shipped as a courtesy without parity promises.

## Decisions (closed 2026-08-10, apply session — 0.1 audit + owner sign-off)

### Decision 4: `el(tagName)` earns its bytes — (a)+(b) combined, confirmed by audit

Full-tree audit (2026-08-10, stories excluded): **89 call sites in 43 files** invoke tags components. 55 are children-prop composition (convert to markup directly); 1 effect return and 9 map/`item:` returns use the functional form legitimately (the `item:` contract dies with `ListItems` — authors own their loops); **10 `is=` sites and a residue of 9 sites in 6 files genuinely need element-as-value**. The residue has exactly three shapes, all "a plain tag as a callable value": the `is=` values themselves (`Div`, `Ul`, `Nav`, `Span`, `Section`, `Footer` — root-tag polymorphism has no slots equivalent, so the `PinkGridHeader` precedent does not extend here); third-party callback contracts (Contentful `renderNode` returning `H1`–`H4` in `StyledRichText`); and pink's `withIcon`/`withTooltip` props transformers (assemble a `Span` into a props object; never render). Core gains a single memoized, tree-shakeable, byte-budgeted `el(tagName)` factory; everything else converts to markup.

### Decision 5: `RouteLink` v1 is minimal — no active-state

`href` + children/slots + internally wired `route()`; `target="_blank"`/external hrefs pass through without SPA hijack. Active-state is deferred — additive later if wanted; keeps the byte budget tight. Designed fresh, not ported: tags' `Link` only defaulted `href`/`target` and plumbed `onClick`.

### Decision 6: Media survivors are `Svg` + `Picture` with the chooser merged

`Svg` ports as-is (sprite-URL convention stays; presentational, tree-shakeable). `Picture` absorbs `ResponsiveImage`'s chooser — no `sources` → bare `<img>` — and `Source` becomes `Picture`'s internal plus an exported props type. Tags' standalone `ResponsiveImage` and `Source` exports have **zero first-party uses** (the app ships its own local `ResponsiveImage`) and are dropped. `Text` deletes (settled earlier; audit confirms zero uses). Note: `mergeAllowedAttrs` has one app consumer (`ContentfulRichText`) needing a home when tags dies.

### Decision 7: Array-reconciliation limitation is documented and deferred

Fragment-rooted values as items of a children array (they stringify — see `2026-08-07-add-named-slots` design) are documented as unsupported. The conversion pattern — interpolate regions in templates, as converted components already do — avoids the path entirely; a core reconciliation fix spins out as its own change only if the pilot trips it.

### Decision 8: Tags endgame — delete + npm deprecate; docs go first; the change splits

`packages/tags` is deleted from the repo once zero first-party imports remain (git history preserves it); published versions get `npm deprecate` pointing to element syntax and the core survivors. Docs sequencing: this change's docs overhaul lands first and `add-server-rendering` rebases its docs on it. Structure: per the proposal's own expectation, the remaining work splits — a concrete `add-core-element-components` change (RouteLink + media + `el()`, spec'd and byte-budgeted), then pink/app conversion + tags retirement, then the lint package.

## Open Questions

- **Pilot scope and metrics.** Which 2–3 pink components pilot the conversion, and capture the unseen number: runtime component-context count before/after (plus pink dist and app bundle sizes). (Deferred to the conversion change's section 0.)

## Risks / Trade-offs

- **Big-bang temptation.** 54 files consume tags; the mitigation is per-component conversion with DOM-parity proofs, never a sweeping rewrite.
- **The array-reconciliation limitation** becomes more visible as template components proliferate (fragment-rooted values in children arrays stringify). Either fix it in core or document arrays-of-regions as unsupported before pink conversion starts.
- **Ecosystem statement.** Dropping tags declares element syntax the kit-agnostic layer; any future UI kit builds on core + markup. Deliberate, but worth saying in the release notes.
