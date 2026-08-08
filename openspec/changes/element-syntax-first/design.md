## Context

See `openspec/changes/archive/2026-08-07-add-named-slots/design.md` for the mechanism this direction rests on (markup compiling to synthesized-component values) and the two composition-path findings that motivate shrinking the value-composition surface: fragment-rooted values in children arrays stringify (open limitation), and the two latent fragment bugs both lived on paths that markup composition avoids.

## Decisions (settled in the 2026-08-07 explore session)

### Decision 1: "Primary," not "required"

The functional form is the compile target and the semantic model; element syntax is sugar over it. Therefore the promotion is an authoring-surface policy — docs lead with markup, pink and the app author in markup, an optional lint package enforces it for teams — never a runtime restriction.

### Decision 2: Survivors live in core, tree-shakeable

Pink is one UI kit of possible many; kit-agnostic components may not live there. `RouteLink` belongs in core because core owns the router — and it is designed fresh (wiring `route()` internally) rather than porting tags' `Link` (which only defaulted `href`/`target` and plumbed `onClick`). Media utilities (`Svg`, `Picture`, `ResponsiveImage`, `Source`) move to core as presentational primitives. Each addition follows the `defineElement` precedent: imported by path or tree-shakeable export, with a byte budget.

### Decision 3: Enforcement ships as a lint package; the repo stays prettier-only

Eslint rules as enforcers (e.g. "no `${Component({…})}` interpolation where element syntax serves", "no `@loom-js/tags` imports"), published like the esbuild plugin is. Not codemods — no external users exist; the in-repo migration is done by hand. Biome: GritQL plugin expressing the same patterns, lint-only (no fix support), shipped as a courtesy without parity promises.

## Open Questions

- **The `el(tagName)` factory.** The 8 polymorphic `is=` sites and some of the 12 value-position sites need "element as value." Candidates: (a) a single memoized core `el('footer')` factory — one ~15-line export replacing 40 wrappers; (b) refactor `is=` patterns away entirely (named slots replaced `PinkGridHeader`'s — do the others follow?); (c) per-component inline `component()` definitions. Leaning (a)+(b) combined: audit each `is=` site first, add `el()` only if genuinely needed after refactors.
- **Media utility API shape in core.** Port as-is, or redesign (`Svg`'s sprite-URL convention is opinionated; is it core-worthy as designed)?
- **`RouteLink` API.** Minimum: `href`, children/slots, wired `route()`; question: active-state affordance (router knows the current route — does `RouteLink` expose it)?
- **Pilot scope and metrics.** Which 2–3 pink components pilot the conversion, and capture the unseen number: runtime component-context count before/after (plus pink dist and app bundle sizes).
- **Tags endgame mechanics.** Delete the package vs archive it; what the final changeset/npm deprecation message says.
- **Sequencing with `add-server-rendering`.** Both rewrite the docs story; both touch core surface. Likely order: spread-props → core survivors → pink conversion (docs updated alongside) → tags removal, with SSR proceeding independently but docs coordinated.

## Risks / Trade-offs

- **Big-bang temptation.** 54 files consume tags; the mitigation is per-component conversion with DOM-parity proofs, never a sweeping rewrite.
- **The array-reconciliation limitation** becomes more visible as template components proliferate (fragment-rooted values in children arrays stringify). Either fix it in core or document arrays-of-regions as unsupported before pink conversion starts.
- **Ecosystem statement.** Dropping tags declares element syntax the kit-agnostic layer; any future UI kit builds on core + markup. Deliberate, but worth saying in the release notes.
