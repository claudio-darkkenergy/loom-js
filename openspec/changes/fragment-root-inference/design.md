# Design — fragment-root-inference

## Context

Today `html-parser.ts` decides a template is fragment-rooted by regex-testing the first static chunk for a leading `<>` (`isTemplateFragment`), strips the token from the first text node, and stores `ctx.root` as `Array.from(childNodes)`; a single-rooted template stores `children[0]`. The compile step (`compile-component-tags/index.ts`) prepends `<>` when a template's statics are all whitespace (component-only top level), and `emit.ts` prepends it to every synthesized children/slot region so regions always render as fragments. Everything downstream (`mount`, `hydrating-roots`, `get-text-update`, `context/helpers`, life cycles) already handles `TemplateRoot | TemplateRootArray` and reads `ctx.fragment` — the token is only the _signal_, not the mechanism.

Three defects hang off the signal (see proposal): the linkedom leak (linkedom splits the leading text node, so the strip misses the token), the lone-interpolation footgun (no element root and no token → nothing captured), and the compiler's own prefixing. Two unrelated typing gaps ride along because they were found in the same docs pass and touch the same file (`types.ts`).

Repo usage of `<>`: 12 sites in `packages/core/tests`, none in `apps/loom`, `packages/pink`, or `packages/highlight`. `collapse-template-whitespace` is an in-flight change that may alter whitespace text nodes; root classification must not depend on their presence.

## Goals / Non-Goals

**Goals:** the parsed tree is the single source of truth for the root form; no authoring token; a top-level dynamic slot is a valid root; regions keep their always-fragment behavior without string surgery; the tag position and `$attrs` types match runtime.

**Non-Goals:** changing what `node()`/handlers receive for a fragment (still every top-level node, whitespace text included — `collapse-template-whitespace` owns that question); a compatibility period for `<>`; changing reconciliation semantics (`activity-array-reactivity`); addressing other `TemplateTagValue` members.

## Decisions

### D1 — Classify the root from the parsed fragment, after parsing

After the template parses into its `DocumentFragment`, take the top-level `childNodes` and ignore whitespace-only `Text` nodes. **Exactly one `Element` and nothing else → single-rooted** (`ctx.root = element`). **Anything else → fragment-rooted** (`ctx.root = Array.from(childNodes)`, `ctx.fragment = true`): several elements, non-whitespace text, comments, or a dynamic-slot placeholder at the top level. Classification is computed once per template per document and cached alongside the parse (it is a property of the statics, not of the interpolations), so the per-render cost is a cached boolean.

_Alternative — classify from the statics at compile time:_ rejected; the native parser is authoritative for what actually became a root (tables, implied tags, comments), and the parse already happens.

### D2 — Regions signal fragment-ness with a flag, not a token

`emit.ts` stops prefixing `<>`. Synthesized children/slot components carry an explicit `fragment: true` on their plan (a property beside `chunks`/`getters`), and the parser honours `plan.fragment` before classifying — so a region with a single element still renders as a fragment, exactly as today (regions reconcile as one unit regardless of node count, and `slots.name` keeps its "bare siblings" contract). Authored templates never set the flag; only the compiler does.

_Implementation note (apply, 2026-09-27):_ a region's statics reach the parser as the `chunks` argument with no transform plan of their own, so the flag cannot ride on `TemplateTransformPlan`. It is a `WeakSet` keyed by the region's statics (`markFragmentRegion` / `isFragmentRegion` in `compile-component-tags/regions.ts`); the plan type is unchanged.

_Alternative — let regions be classified like any template:_ rejected; a one-element region would silently become single-rooted, changing `node()` shape for the region's context and inviting subtle reconciliation differences for no gain.

### D3 — `<>` is removed without a migration path

The parser stops recognizing the token entirely: no strip, no compatibility period, no migration error. A `<>` left in a template is ordinary text and renders as such, the same as any other characters — the version bump and changeset note carry the change (maintainer direction, 2026-09-27).

_Alternatives — accept-and-strip for one minor, or a first-render migration error:_ both rejected; neither is wanted for a pre-1.0 removal with no in-repo consumers.

### D4 — The lone top-level interpolation is a fragment root

`` html`${Child()}` `` parses to a single placeholder text node at the top level → fragment (D1). The existing post-wiring re-capture of `ctx.root` (already present for fragments, because wiring a top-level slot replaces the placeholder) makes the live node(s) the root. Component-only templates fall out of the same rule, so the compiler's `statics[0]` rewrite in `compile-component-tags/index.ts` is deleted.

### D5 — Types: a bivariant component callable in `TemplateTagValue`; `AttrBinding` in `$attrs`

`Component<any>` resolves `{} extends any` to the optional-parameter branch, and a required-parameter function is not assignable to it — that is the whole tag-position gap. Add a dedicated member to `TemplateTagValueBase`:

```ts
// Method-shorthand for parameter bivariance: admits component callables
// with required, optional, or no props.
type ComponentCallable = {
    bivarianceHack(props?: any): ContextFunction;
}['bivarianceHack'];
```

and replace `AnyComponent<any>` with it (or add beside it). `AttrsTemplateTagValue`'s entry type gains `AttrBinding` (`ValidAttrValue | AttrBinding | Record<…> | StyleProp`). Both are widening changes; `core-type-surface`'s "Required props are enforced at call sites" is untouched because the call form still goes through `Component<Props>`.

### D6 — Single-element fragments become single roots

A template previously written `<><div>…</div>` now classifies as single-rooted: `node()` returns the element, not a one-item array. Accepted as part of the breaking change; the migrated fixtures cover both shapes.

## Risks / Trade-offs

- [Whitespace text nodes at the top level differ across DOM implementations] → classification ignores whitespace-only text; the server parity test renders the same fragment template under linkedom, jsdom and Happy DOM and asserts identical output and identical root form.
- [A top-level HTML comment makes a template a fragment] → intended (a comment is a real node the author placed at the top level); documented in the root-forms spec.
- [Table templates (`table-template-parsing`) rely on the parser's wrapping] → classification runs on the fragment the table-aware parse produces; its existing tests are the regression net.
- [Widening `TemplateTagValue` admits more junk] → the added member requires a `ContextFunction` return, so arbitrary functions still fail; event listeners were already admitted.

## Migration Plan

Land core (parser, compile, types, fixtures) with a `@loom-js/core` changeset carrying a BREAKING note (the only migration artifact); docs follow in the same change through the parity task (README `### Fragments`, the `fragments` topic's token/root-form sections, the Components and Element Syntax pointers, content map, drafts pushed and published). Rollback is a revert — no data or content-model change.

## Open Questions

None — the maintainer settled removal (no back-compat, no migration error) and the silent single-element semantics change (2026-09-26/27).
