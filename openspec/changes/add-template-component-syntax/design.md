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

Resolution: children markup compiles into a **synthesized component** — a template function allocated during the transform pass and reused thereafter. Because the transform runs once per call site, that function has stable identity, which is what the context-reuse machinery keys on.

#### Which reuse mechanism actually applies (corrected 2026-08-04)

An earlier draft of this decision justified reuse by citing `ctxScopes`:

```ts
const scopedCtx = liveCtx.ctxScopes?.get(templateFunction); // component.ts:36-38
```

**That is the wrong map for the list case.** Traced through the source, loom has _two_ distinct context-reuse mechanisms and they serve different purposes:

|            | `ctxScopes`                                                                                        | `parentCtx.children`                             |
| ---------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Shape      | `Map<TemplateFunction, ComponentContextPartial>`                                                   | `Map<number \| string, ComponentContextPartial>` |
| Keyed by   | template-function identity                                                                         | `props.key ?? array index`                       |
| Created at | `activity.ts:112`, on the **effect's** ctx only                                                    | `helpers.ts:13`, lazily on any parent ctx        |
| Slots      | **one per template function**                                                                      | one per key                                      |
| Purpose    | keep two _different_ components from clobbering each other in one effect slot (`cond ? A() : B()`) | give each _item in a list_ its own context       |

For an array-valued effect, per-item context does **not** come from `ctxScopes`:

```
activity.ts:101-108     textUpdater(root, value, effectCtx)
get-text-update.ts:30   handleArrayValue([...], parentCtx = effectCtx)
get-text-update.ts:65   appendChildContext(parentCtx, newVal, ctxSnapshot.key ?? i)
helpers.ts:19-24        → per-key {} pulled from parentCtx.children
component.ts:39         that child ctx has NO ctxScopes → takes the `ctx = liveCtx` branch
```

So the array path deliberately routes _around_ `ctxScopes`. This matters to the transform in two concrete ways, both probed 2026-08-05 (tests below; results also in the Resolved section):

1. **One slot per template function — no reachable collision.** ~~Unproven.~~ Probed: `tests/unit/context-scopes.spec.ts`. A `ctxScopes`-carrying context is only ever the effect ctx (`activity.ts:112`), and it resolves exactly **one** value directly — the effect's return (`activity.ts:101-108`) — so at most one live instance of a template function can occupy its `ctxScopes` slot at a time. Every multi-instance path routes around the map: template-slot instances get per-slot contexts via `appendChildContext(ctx, value, slotIndex)` (`set-reactive-updates.ts:14`), and array instances get per-key/per-index contexts via `appendChildContext(parentCtx, value, key ?? i)` (`get-text-update.ts:65`). All three paths confirmed empirically: same-slot reuse across re-runs, two same-template slots staying distinct, and a three-instance unkeyed array staying distinct.
2. **Key inheritance gap — does not exist for the emission shape.** ~~Unproven.~~ Probed: `tests/unit/activity-array.spec.ts` ("keyed reconciliation with nested children"). A child interpolated in a template slot of a keyed item is keyed by **interpolation-slot index within the per-key parent context**, not by list position — so it inherits its parent's keyed reconciliation implicitly and moves with it across reorders (identical node references across single and repeated reorders). See Decision 10.

### Decision 4: Detect component tags by chunk-boundary signal

A component tag is the only construct where a chunk ends in `<` or `</` immediately before an interpolation. Scanning for that is cheap and unambiguous; all other text passes through untouched.

### Decision 5: `</>` is the single closing form (decided 2026-08-04)

A component element closes with `</>` — not `</${Component}>`, and not `<//>`.

The opening tag already carries the disambiguation: `<>` opens a rootless fragment, `<${Component}>` opens a component. `</>` therefore closes whichever construct is open, and naming the component again at the close is redundant verbosity plus a second matching rule to implement.

The fragment sigil does not conflict, because it cannot nest. `<>` is recognized only by

```ts
const isTemplateFragment = /^<>/.test(chunks[0]?.trim() ?? ''); // html-parser.ts:30
```

— anchored to the start of the **first** chunk, making it a template-level marker rather than a nestable construct. So at any point where `</>` appears, there is exactly one candidate it can be closing.

Note the cost this does not avoid: `</>` is plain text _inside_ a chunk, not adjacent to an interpolation, so Decision 4's chunk-boundary signal does not catch it. The scanner needs a second text-scanning rule plus an open-component stack. `</${Component}>` would have needed the stack anyway to validate the match, so this is not a regression against the rejected alternative.

~~**Open sub-case:** what `</>` means with an _empty_ component stack.~~ Resolved — it throws. See Decision 9.

### Decision 6: Malformed syntax throws at transform time (decided 2026-08-04)

Anything outside the accepted grammar raises, rather than falling through to native parsing. Falling through would mis-render silently, which is the worse failure.

This is cheap because of Decision 1: the transform runs once per call site, so the throw fires on that site's **first render**, not per render. The error must name the offending construct and include the surrounding chunk text.

### Decision 7: Attribute-name type checking is deferred (decided 2026-08-04)

Checking attribute _names_ against the component's `Props` at the type level is theoretically reachable — TypeScript does give literal types to `TemplateStringsArray` under a generic tag. But it would require correlating names held in the `chunks` literal types against props held in `interpolations[0]`'s type, positionally, across two variadic tuples, recursing character-by-character. That is deep instantiation on the framework's most-used type; the realistic outcome is hitting instantiation-depth limits and degrading editor responsiveness on real templates. The repo also just moved to TypeScript 7's Go compiler (`c4e1cd3`), whose perf profile for that machinery should not be assumed.

Deferred, not rejected. The cheaper fraction is available: because the transform emits `Component({ ...props })`, a generic transform can type-check the interpolated **values** (`onClick=${fn}` — is `fn` the right shape?) without checking the names. See tasks for the time-boxed spike and its acceptance bar.

### Decision 8: `$` is forbidden on component tags (decided 2026-08-04)

Component-tag attributes carry no sigil: `<${PinkButton} isOnlyIcon icon="icon-menu" onClick=${fn} />`. Any `$`-prefixed attribute on a component tag throws at transform time (Decision 6), with a message stating that component props take no sigil and suggesting the unprefixed name.

Why forbidden beats the other two options:

1. **The sigil carries no information on a component tag.** Every attribute of a component element is a prop, and the grammar already fully determines the value kind without help: `name` is boolean `true`, `name="…"` is a static string, `name=${…}` is a JS value passed by reference. "Required" would be pure noise (`$icon="icon-menu"` says nothing `icon="icon-menu"` doesn't); "meaningful" (e.g. `$` marks interpolated values) would duplicate what the `=${` that follows already says, creating two new error classes (`$` without interpolation, interpolation without `$`) for zero expressive gain.
2. **The "required" option's rationale is factually wrong about the existing element semantics.** The tempting rhyme — "`$` means a JS value crosses here" — is not what `$` means on real elements today. Standard attributes already take interpolated values _without_ `$` (`getStandardAttrUpdate`, `get-attr-update.ts:39-42`); what `$` actually selects is a name-dependent special dispatch — `$attrs` spread, `$on` listener map, `$props` for custom elements, `$click`-style event binding, and a custom-element-prop fallback (`get-attr-update.ts:51-105`). That is an overloaded namespace whose meaning depends on the attribute name and the node type. Importing it onto component tags — where no such dispatch exists — would make one character mean different things on adjacent lines of the same template.
3. **1:1 mapping to the compiled form.** The transform emits `Component({ name: value })`; with no sigil, the attribute name _is_ the prop key, verbatim. No strip rule, no "which spelling produced this key" ambiguity, and converting existing `Component({ … })` calls to element syntax is mechanical in both directions.
4. **Forbidden is the only option that preserves future optionality.** Because `$…` throws today, a later change could assign `$` a component-tag meaning (say, `$ref`) without breaking anything. "Required" and "meaningful" both spend the namespace now.

Consequences applied elsewhere: `proposal.md`'s motivating example and transform sketch, the prop-forms bullet, and the `specs/template-component-syntax/spec.md` "props are passed as attributes" scenario all drop the `$` spellings; the grammar (below) lists `$`-prefixed names as a transform-time throw.

### Decision 9: `</>` with an empty component stack throws (decided 2026-08-04)

An unmatched `</>` — one that appears while no component tag is open — is malformed syntax per Decision 6, not a fragment terminator.

- **There is never a legitimate construct for it to close.** Per Decision 5, `<>` is a template-level marker recognized only at the start of the first chunk (`html-parser.ts:30`) — it is not on the component stack, and rootless templates have no closer today. So an empty-stack `</>` cannot be matching anything; it is an extra close or a misremembered fragment-closer, and both are authoring mistakes.
- **"Terminate the fragment" would invent semantics.** A rootless template's root is its entire child list; a mid-template terminator would leave trailing content in an undefined state (still rendered? silently dropped? error?). Every answer adds a rule that exists only to serve a construct nobody can currently write.
- **No back-compat break.** The transform's fast bail-out means a template with no component-tag signal is never scanned, so a stray literal `</>` in an existing template keeps today's behavior (the native parser silently drops it). The throw fires only in templates that already use component syntax — exactly where a stray `</>` should be loud rather than silently vanishing.

The error message names the construct (`</>`), states that no component tag is open, and includes the surrounding chunk text per Decision 6.

### Decision 10: The transform does not forward `key` to synthesized children (decided 2026-08-05)

Synthesized children components stay keyless, deliberately. The 1.2 probe (`tests/unit/activity-array.spec.ts`, "keyed reconciliation with nested children") shows the feared gap does not exist for the transform's emission shape: a child interpolated in a template slot of a keyed item gets its context from `appendChildContext(parentCtx, value, slotIndex)` (`set-reactive-updates.ts:14`) — keyed by **interpolation-slot index inside the per-key parent context**. Slot index is stable regardless of list position, so the child inherits its parent's keyed reconciliation implicitly; forwarding the parent's `key` would add plumbing with no observable effect.

Boundary this rests on: Decision 3 emits exactly **one** synthesized component per children region, in slot position. Keys only matter in **array** position, and the transform never emits synthesized components into arrays. Author-supplied arrays inside children markup keep today's semantics — the author keys them, exactly as in the functional form.

## Accepted Grammar (task 0.3 — the scanner is built and tested against this)

Scope: this grammar defines only the component-tag layer. Markup that is not part of a component construct passes through to the native parser byte-for-byte, with today's semantics — including today's silent-drop behavior for sequences the native parser discards. Decision 6's throw-on-malformed applies to _component syntax_, not to plain HTML.

### Activation (fast bail-out)

The transform scans a template at all only if at least one chunk **ends with `<` or `</` immediately before an interpolation** — no intervening characters, not even whitespace. Otherwise the template is untouched and the input to `createContextualFragment` is byte-identical to today.

Consequence: every rule below, including every throw, applies only to templates containing at least one such signal. `< ${x}` (with a space) is plain text — which is also the escape hatch, alongside `&lt;`, for a literal less-than before an interpolation (`html`\`a < ${b}\``).

### Tokens recognized in text position

Once scanning is active, the scanner walks every chunk. In text position (outside any component tag's attribute region) it reacts to exactly these signals:

| Signal                                              | Meaning                                                                                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| chunk ends `…<` + interpolation                     | component **open tag**; the interpolated value is the component                                                                         |
| chunk ends `…</` + interpolation                    | **throw** — the named closing form `</${Component}>` is not accepted (Decision 5)                                                       |
| `</>` in chunk text (exact, no interior whitespace) | **closes** the innermost open component tag; empty stack → **throw** (Decision 9)                                                       |
| `</` followed by `/`                                | **throw** — the `<//>`-style closing form is not accepted (Decision 5)                                                                  |
| `</` followed by an ASCII letter                    | plain HTML end tag — passes through                                                                                                     |
| any other `<`                                       | plain text/markup — passes through (includes the `<>` fragment marker, which the transform must leave in place for `html-parser.ts:30`) |

To render the literal text `</>` inside a component-bearing template, interpolate it (`${'</>'}`); as chunk text it is always the close token.

At render time, the plan calls each tag-position value as a function. A non-callable tag value throws an error naming the interpolation position — this is the one check that cannot happen at transform time, because the transform sees only text.

### Component tag

```
component-tag := '<' ‹interp: Component› attrs ( '/>' | '>' children '</>' )
```

- The tag interpolation must be **immediately** followed by whitespace, `/>`, or `>` (i.e. the following chunk starts with one of those). Anything else — e.g. `<${B}icon=…` — throws.
- The attribute region (`attrs`) spans chunk boundaries: every `name=${value}` splits the chunks, so the scanner carries its attribute-region state across interpolation boundaries.
- Whitespace (including newlines) separates attributes and may precede `/>` or `>`.
- **Component-only templates become fragments.** A template whose top level consists solely of component elements and whitespace (e.g. the proposal's own `` html`<${PinkButton} …/>` ``) has no top-level HTML element after the transform, so the transform marks its derived chunks as a rootless fragment (prepends the `<>` marker). The template then takes the existing `isTemplateFragment` path (`html-parser.ts:30`) — same semantics authors get from `<>` today. Synthesized children templates are always fragments for the same reason: a children region has no single-root guarantee.

### Attributes

```
name := [A-Za-z_][A-Za-z0-9_-]*
```

The name becomes the prop key **verbatim** — no camelCasing, no lowercasing. (Component tags never reach the native parser, so unlike real-element attributes, `onClick` survives exactly as authored.)

| Form                | Compiles to            | Notes                                                                                                                                 |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `name`              | `props[name] = true`   | boolean shorthand; terminated by whitespace, `/>`, or `>`                                                                             |
| `name="text"`       | `props[name] = 'text'` | static string; `'` or `"` quotes; the value is a **raw JS string** — no HTML entity decoding (`a="&amp;"` yields the literal `&amp;`) |
| `name=` ‹interp: v› | `props[name] = v`      | JS value passed by reference; the chunk must end exactly with `name=`                                                                 |

- `=` must immediately follow the name and be immediately followed by the opening quote or the interpolation boundary — no whitespace around `=`.
- A duplicate name **last-wins**, mirroring the compiled object literal (`{ a: 1, a: 2 }` is legal JS with the same semantics).
- `key` is an ordinary attribute (`key=${id}`, `key="static"`) — it lands in `props` and participates in keyed reconciliation per the Resolved note on `key`.

**Throws in the attribute region** (all at transform time, per Decision 6, naming the construct and surrounding chunk text):

- A `$`-prefixed name (Decision 8 — `$` is element-only; the message suggests the unprefixed name).
- A quoted value containing an interpolation (`a="x ${y}"`): a quoted static value must open **and close within one chunk**. For composite strings, interpolate a template literal: ``a=${`x ${y}`}``.
- An unquoted static value (`a=b`).
- An opening quote with no closing quote in the same chunk.
- An interpolation anywhere other than immediately after `name=` — this rejects attribute-name position (`${name}=${v}`) and spread props (`...${props}`) alike.
- Any character sequence that is not whitespace, a `name`, `/>`, or `>`.
- End of template inside an attribute region (unterminated component tag).

### Children

Everything between a component tag's `>` and its matching `</>` is the children region: arbitrary markup, interpolations, and nested component tags, to any depth (open tags push onto the stack; `</>` pops the innermost). The grammar only **delimits** the region — its compilation into a synthesized component is Decision 3's territory and section 3 of tasks.

### Structural throws

- `</>` with an empty component stack (Decision 9).
- End of template with a non-empty stack — unclosed component tag; the error names the position of the unclosed open tag.

### Deliberately excluded from v1

Each of these throws (or, where noted, is inert text), so adding it later is non-breaking:

- `</${Component}>` and `<//>` closing forms — throw (Decision 5).
- `$`-prefixed component props — throw (Decision 8); the namespace stays reserved.
- Interpolations inside quoted attribute values — throw; use ``name=${`…`}``.
- Unquoted attribute values — throw.
- Spread props (`...${props}`) — throw; pass an object to a named prop or use the functional form.

## Implementation findings (2026-08-06)

- **Latent fragment-root bug, now fixed.** For rootless (`<>`) templates, `htmlParser` captured `ctx.root = Array.from(liveFragment.childNodes)` **before** `setUpdatesForPaths` ran — but wiring a **top-level** dynamic slot replaces those very placeholder text nodes (`set-updates-for-paths.ts` calls `dynamicNode.replaceWith(textFragment)`), leaving `ctx.root` referencing detached nodes. Existing templates only put slots _inside_ elements, so it never surfaced; the transform's fragment-ized outputs (component-only templates, synthesized children) put slots at the top level and hit it immediately. Fix: re-capture the fragment root after updates are wired. This is a behavioral bug fix for all fragment templates, not only transformed ones — covered by the "component-only template" and "nested children" integration specs.
- **Byte budget: met at 1,524 B of 1,536 B.** Post-implementation `dist/index.mjs` measures 8,987 B min+gzip against the 7,463 B baseline (same measurement command as the budget entry). An initial cut came in 15 B over; trimming decision-reference parentheticals from error messages and deduplicating one repeated message brought it under without touching the grammar.
- **Two type-level widenings surfaced by the real-world conversion (task 4.4, 2026-08-07).** Both are type-only — zero runtime bytes:
    1. `TemplateTagValueBase` accepted `Component` but not `SimpleComponent` with arbitrary `Props`, so `<${PinkButton} …/>` (a `SimpleComponent<PinkButtonProps>`) failed to type-check in tag position. Widened to `AnyComponent<any>`, whose contravariant `ComponentInputProps<any>` parameter accepts any component-shaped callable.
    2. `TemplateTagValue`'s object form was `Record<string, TemplateTagValueBase>` — one level deep — so an object prop with an array member (`gridCol2=${{ items: […] }}`) failed. Made recursive (`{ [key: string]: TemplateTagValue }`), matching what the runtime has always passed through by reference and what the proposal promises ("arbitrary JS: objects, arrays, functions").

## Risks / Trade-offs

- **Hottest code path in the framework.** → Mitigation: purely additive; templates without component tags produce byte-identical input to the existing pipeline. Guard with a fast bail-out before any scanning.
- **Bundle size in a zero-dependency package.** → Mitigation: the scanner only needs to handle component tags, not full HTML. Set an explicit byte budget and measure.
- **Attribute-region scanning spans chunk boundaries** — quoted values, boolean attrs, self-closing vs. `</${X}>` vs. `<//>`. → Mitigation: the accepted grammar is now specified up front (see Accepted Grammar above); anything outside it throws rather than guessing.
- **Sub-template cache keying.** A slice of chunks has no stable `TemplateStringsArray` identity. → Mitigation: cache derived sub-chunks on the parent's cache entry, not in a global keyed store.

## Resolved (2026-08-04)

Recorded here so the reasoning is not re-litigated.

- **Closing-tag syntax** → `</>` only. See Decision 5.
- **Error behavior for malformed tags** → throw at transform time. See Decision 6.
- **Type safety** → deferred with a scoped spike, not rejected. See Decision 7.
- **`$` on component tags** → forbidden; `$`-prefixed names throw at transform time. See Decision 8.
- **`</>` against an empty component stack** → throws; it is never a fragment terminator. See Decision 9.
- **Accepted grammar** → written down explicitly, including attribute regions that span chunk boundaries. See the Accepted Grammar section; it is the artifact the scanner is built and tested against (tasks 0.3, 3.2).
- **Byte budget (2026-08-05)** → the transform (scanner + plan builder + throw path) may add **at most 1,536 bytes (1.5 KiB) min+gzip** to the ES bundle. Measurement is reproducible: `pnpm -F @loom-js/core build-package`, then `esbuild dist/index.mjs --minify | gzip -9 | wc -c`, compared against the pre-change baseline of **7,463 bytes** (raw `dist/index.mjs` 21,917 B; minified 19,695 B; measured 2026-08-05 at commit `70c5981` with the workspace esbuild). A breach is a design smell — the grammar or the plan representation is too large — and gets redesigned, not renegotiated.
- **`ctxScopes` collision (2026-08-05)** → not reachable on any existing path; probed in `tests/unit/context-scopes.spec.ts`. See the Decision 3 correction, point 1.
- **Children of keyed items (2026-08-05)** → reconcile with their parents; no index-keyspace gap for the transform's emission shape. Probed in `tests/unit/activity-array.spec.ts`. See the Decision 3 correction, point 2, and Decision 10 (no `key` forwarding).
- **How `key` props are supplied** → _no design work needed; the mechanism already exists._ `key` is an ordinary prop, not special syntax:

    ```ts
    colors.map((color) => Box({ key: color, color })); // tests/unit/activity-array.spec.ts:26
    ```

    It flows `component.ts:80` (`ctx.key = props.key`) → `get-text-update.ts:64`, where `getContextForValue` **dry-runs** the context function (`value({}, true)` at `helpers.ts:44`, returning early at `component.ts:88-90`) to read `.key` _without rendering_ → `appendChildContext(parentCtx, newVal, ctxSnapshot.key ?? i)`. So `key=${item.id}` in element syntax simply compiles into the props object like any other prop.

    Two details the transform must respect:
    - Unlike `ref` (deleted at `component.ts:68`), **`key` is not stripped** — it stays in `ctx.props` and spreads into the template function's args.
    - `getContextForValue` tests `value.name === 'contextFunction'` **exactly**, not the loose `.endsWith('contextfunction')` used elsewhere. So `activityContextFunction` values never get a snapshot and can never carry a key — they always fall back to index.

    Existing coverage in `tests/unit/activity-array.spec.ts:78-165`: keyed reorder, full reversal, numeric keys, and numeric-key-equals-index.

## Open Questions

None. All open questions are closed — see the Resolved section. The remaining unknowns (actual scanner size vs. budget, hot-path impact) are measurements scheduled in tasks 4.2 and 4.3, not design questions.
