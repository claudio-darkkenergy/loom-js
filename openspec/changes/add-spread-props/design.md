## Context

The component-tag transform (`compile-component-tags/`) compiles attribute regions into `[name, getter]` pairs applied in order onto a props object, with markup-derived `children`/`slots` assigned afterward. The parent grammar rejects any attribute-region interpolation not immediately preceded by `name=` — which is exactly where `...${props}` sits today, as a deliberate reservation. `PinkGridHeader` (post-`add-named-slots`) is the live example of the enumeration this removes.

## Goals / Non-Goals

**Goals:**

- `...${object}` in component-element attribute regions, with object-literal ordering semantics.
- Zero behavior change for every template that compiles today (the form currently throws).
- Small, budgeted byte cost on the same scanner.

**Non-Goals:**

- Spread on plain HTML elements (`$attrs` already serves that).
- Static spread forms (`...{ a: 1 }` as text) — interpolated objects only.
- Any change to `children`/`slots` precedence.

## Decisions

### Decision 1: The only accepted form is `...` immediately before an interpolation

The scanner recognizes a chunk ending in `...` inside an attribute region as the spread signal (mirroring how `name=` at chunk end marks a value interpolation). `...` followed by anything else in the attribute region throws with the existing unexpected-character discipline. No whitespace between `...` and the interpolation.

### Decision 2: Source-order application, last wins

Props emit in authored order — named props and spreads interleaved exactly as written — onto one object, so duplicates resolve by position like an object literal. This generalizes the parent's duplicate-name rule rather than adding a second rule. Markup-derived `children` and `slots` remain assigned after the props loop (existing precedence, unchanged).

### Decision 3: JS spread semantics at render time — no new throw

The getter applies `Object.assign`-style spreading per render. Nullish and primitive values are a no-op, matching `{ ...null }` / `{ ...5 }` in JS. No render-time type check: the functional form never had one, and the two forms must stay interchangeable sugar.

### Decision 4: Spread values cannot carry transform-time constructs

A `slot` key inside a spread object is an ordinary prop named `slot` — never a region label, because labels are resolved at transform time against static text and spread values exist only at render time. Same reasoning as the parent's rejection of interpolated labels; documented rather than guarded (there is nothing to throw on — the key is simply a prop). `key` and `ref` via spread behave exactly as in the functional form.

### Decision 5: Byte budget — 160 B min+gzip over the measured baseline (task 0.1, decided 2026-08-08)

Set in tasks section 0 against the measured post-`add-named-slots` baseline (9,850 B min+gzip, same measurement command). Expected cost is small: one token recognition in `scanAttrs`, one pending-spread state, one spread step in the emit loop.

**Decided:** the spread addition may add **at most 160 bytes min+gzip** to `dist/index.mjs`. Baseline re-measured 2026-08-08 at exactly **9,850 B** (no drift from the `add-named-slots` close), giving a ceiling of **10,010 B**. Measurement command unchanged: `pnpm -F @loom-js/core build-package`, then `esbuild dist/index.mjs --minify | gzip -9 | wc -c` with the workspace esbuild. Per the parent's discipline: a breach is a design smell to be redesigned, not renegotiated.

## Risks / Trade-offs

- **Hot path**: same mitigation as always — the no-op guard is untouched, and the new token only activates inside attribute regions of component tags.
- **Ordering bugs**: the emit currently pushes `[name, getter]` pairs; spreads become entries in the same ordered list so application order falls out of the existing loop rather than a merge step.

## Open Questions

None blocking — the grammar reservation was designed for exactly this addition.
