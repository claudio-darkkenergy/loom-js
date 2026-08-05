## Context

`htmlParser` (`packages/core/src/html-parser.ts`) joins the template chunks with a token and hands the result to the browser's own parser:

```ts
const fragment = document
    .createRange()
    .createContextualFragment(chunks.join(config.TOKEN));
```

This is why component-element syntax cannot work directly: an interpolation in tag-name position becomes a token, and the native parser does not read tokens as tag names. The transform proposed here sidesteps that by rewriting component tags out of the markup _before_ the join, leaving the native parser to handle only real HTML — which it should keep doing.

## Goals / Non-Goals

**Goals:**

- Element syntax for composing components, with attribute-style props carrying arbitrary JS values.
- Zero cost for templates that use no component tags.
- No new runtime semantics — compile to the existing `${Component({…})}` composition form.

**Non-Goals:**

- Replacing native HTML parsing for ordinary markup.
- Custom-element registration (separate change; that one is about interop, this one is about authoring).
- Any change to how `activity`/effects reconcile.

## Decisions

### Decision 1: Transform at the front of `htmlParser`, cached per call site

The transform maps `(chunks, interpolations)` to `(derivedChunks, derivedInterpolations)`. `derivedChunks` depends only on the source text, so it is computed once and cached under the same `TemplateStringsArray` key the fragment cache already uses. Per the language spec, a template-literal site yields one frozen `TemplateStringsArray` identity for the life of the program, so this is a once-ever cost per site.

- **Alternative:** a build-time transform (esbuild/babel plugin). Rejected — it would make a compiler step mandatory for a framework that currently runs from a plain `<script>` with no build.

### Decision 2: Derived interpolations are recomputed per render, not cached

`derivedChunks` is static, but the derived _values_ are not: `<${Button} label=${x}/>` compiles to `Button({ label: x })`, and `x` changes between renders. The cached artifact is therefore a plan — a function from raw interpolations to derived interpolations — not a value. Only the plan is cached; it is applied on every render.

### Decision 3: Nested children compile to synthesized components, never nested `html` calls

**This is the load-bearing constraint.** `html` is bound to a single component instance:

```ts
ctx.render = htmlParser.bind(ctx); // component.ts:56
```

and `htmlParser` overwrites that context whenever it sees a different chunks array:

```ts
if (ctx.chunks !== chunks || …) {   // html-parser.ts:62
    ctx.chunks = chunks;
    ctx.values = reactive(valueObj, …);
    ctx.root = liveFragment.children[0];
}
```

So emitting a bare nested `` html`…` `` for children would not share the outer context — it would **clobber** it, replacing the outer component's `root` and `values`. (This is a pre-existing invariant of the framework: one template per component per render. Even `x ? html`<a/>` : html`<b/>`` thrashes today.)

Resolution: children markup compiles into a **synthesized component** — a template function allocated during the transform pass and reused thereafter. Because the transform runs once per call site, that function has stable identity, which is exactly what the existing scoping mechanism keys on:

```ts
const scopedCtx = liveCtx.ctxScopes?.get(templateFunction); // component.ts:37-40
```

The synthesized component therefore gets its own scoped context and participates in reuse and life-cycles identically to a hand-written one.

### Decision 4: Detect component tags by chunk-boundary signal

A component tag is the only construct where a chunk ends in `<` or `</` immediately before an interpolation. Scanning for that is cheap and unambiguous; all other text passes through untouched.

## Risks / Trade-offs

- **Hottest code path in the framework.** → Mitigation: purely additive; templates without component tags produce byte-identical input to the existing pipeline. Guard with a fast bail-out before any scanning.
- **Bundle size in a zero-dependency package.** → Mitigation: the scanner only needs to handle component tags, not full HTML. Set an explicit byte budget and measure.
- **Attribute-region scanning spans chunk boundaries** — quoted values, boolean attrs, self-closing vs. `</${X}>` vs. `<//>`. → Mitigation: keep the accepted grammar deliberately small and specified up front; reject and error clearly on anything outside it rather than guessing.
- **Sub-template cache keying.** A slice of chunks has no stable `TemplateStringsArray` identity. → Mitigation: cache derived sub-chunks on the parent's cache entry, not in a global keyed store.

## Open Questions

- **Does the synthesized-component identity hold for array-valued effects?** Decision 3's reuse argument depends on `ctxScopes` resolving to the same context each time an effect callback re-runs. This is adjacent to the ground covered by `fix-activity-array-node-reuse` and should be treated as unproven until implemented and tested with a list that reorders.
- What is the closing-tag syntax — `</${Component}>`, `<//>`, or both?
- How are `key` props supplied for reconciliation of component lists in element syntax?
- Can the syntax be made type-safe (attribute names checked against the component's `Props`), or is it necessarily untyped at the call site?
- What is the error behavior for a malformed component tag — throw at transform time, or warn and fall through to native parsing?
