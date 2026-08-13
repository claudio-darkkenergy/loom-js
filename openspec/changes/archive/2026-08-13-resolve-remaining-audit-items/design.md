# Design — resolve-remaining-audit-items

## Context

Three independent debt items, all discovered/parked during earlier baseline work:

1. **`packages/core/src/lib/templating/get-attr-update.ts`** (now 514 lines) still has the open 🟡 OCP audit entry. `getSpecialAttrUpdate` dispatches through a `switch(true)` (lines 68–124) whose branches each `.bind()` a _differently shaped_ context onto an entry of the `specialAttrUpdaters` object: `attrs` gets a fresh `bindingRegistry` Map plus `hostCtx`, `on` and `event` share a `listenerCtx`, `props` and `default` get only the basics. Adding a new `$`-special attribute today means editing both the switch and the updater map — two edits in the hottest update path in the framework.
2. **`openspec/specs/core-baseline-health/spec.md`** was archived in raw delta format: it opens with `## ADDED Requirements` and has no `## Purpose` section, unlike every other spec in `openspec/specs/`.
3. **`@loom-js/loom` fails `type-check` with three pre-existing errors**: `project/client/dev.mts:15` destructures `host` from esbuild's `ServeResult`, but the installed esbuild's `ServeResult` is `{ port: number; hosts: string[] }`; and `src/app/bootstrap.ts:1-2` side-effect-imports `@appwrite.io/pink` / `@appwrite.io/pink-icons`, which are CSS-only packages (`main` points at a `.css` file, no JS, no types), producing `TS2882` under TypeScript 7 / NodeNext.

Constraints: `strict` + `noUncheckedIndexedAccess` everywhere; repo prefers declarative framework idiom over micro-tuning; the audit rule requires updating `SOLID-AUDIT-REPORT.md` when a violation is fixed.

## Goals / Non-Goals

**Goals:**

- Close the `get-attr-update.ts` OCP entry with a behavior-preserving dispatch-map refactor.
- Normalize `core-baseline-health/spec.md` to standard spec format (Purpose + Requirements).
- Make `pnpm -F @loom-js/loom type-check` exit clean, and spec that baseline so it stays clean.

**Non-Goals:**

- No new special attribute types (`$ref`, `$key`, `$bind` remain future work — this change only makes them cheap to add).
- No changes to standard-attribute handling (`getStandardAttrUpdate`) or to the other open audit entries (`log.ts`, `life-cycles.ts`, `set-updates-for-paths.ts`, `config.ts`).
- No requirement-content changes to `core-baseline-health` — formatting repair only.
- No esbuild upgrade or dev-server behavior change in `apps/loom`.

## Decisions

### D1 — Dispatch map of _updater factories_, not bare updaters

A naive `specialAttrUpdaters[nodeName]` lookup can't replace the switch, because each branch constructs different per-node state at bind time (`attrs` needs a fresh `bindingRegistry` Map per attribute; `event` seeds `listenerCtx.eventListener = undefined`; `on` reuses `listenerCtx` as a collection). So the unit of the map becomes a **factory**:

```ts
type SpecialAttrUpdaterFactory = (args: {
    attr: Attr;
    dynamicNode: DynamicNode;
    hostCtx?: ComponentContextPartial;
    nodeName: string;
}) => TemplateNodeUpdate;
```

Each named key (`attrs`, `on`, `props`) becomes an entry in a `specialAttrUpdaterFactories` map that owns building its context and returns the bound updater. The existing updater implementations move inside (or are closed over by) their factories, which also eliminates the current `as BoundSpecialAttrTemplateNodeUpdate` casts — each factory is fully typed for its own context shape.

Dispatch collapses to:

```ts
const factory =
    specialAttrUpdaterFactories[nodeName] ??
    (config.events.includes(nodeName as ConfigEvent)
        ? eventUpdaterFactory
        : defaultUpdaterFactory);
const updater = factory({ attr, dynamicNode, hostCtx, nodeName });
```

A new special attribute type is then one new map entry — no dispatch edit. Under `noUncheckedIndexedAccess` the lookup types as `SpecialAttrUpdaterFactory | undefined`, which the `??` fallback handles without a cast.

_Alternative considered:_ a descriptor map (`{ update, buildCtx }` pairs). Rejected — two parallel shapes per key where one closure does the job; factories are the simpler, equally extensible unit.

### D2 — `event` and `default` stay as fallback tiers, outside the map

Event names are dynamic (driven by `config.events`, extendable at runtime via `appendEvents`), so they cannot be static map keys. The fallback chain — named key → known config event → default — exactly reproduces the switch's case order, so precedence is unchanged (e.g. a hypothetical config event named `attrs` still loses to the named `attrs` handler, as it does today).

### D3 — `dev.mts` adopts `hosts` from the current `ServeResult`

Replace the `{ host, port }` destructure with `{ hosts, port }` and pick the first entry — `hosts[0]` is `string | undefined` under `noUncheckedIndexedAccess`, so fall back explicitly:

```ts
const { hosts, port } = await ctx.serve({ ... });
const host = hosts[0] ?? 'localhost';
```

The logged URL keeps the existing `0.0.0.0 → http://localhost` mapping. No serve options change.

### D4 — Ambient module declarations for the CSS-only Appwrite packages

Append to the app's existing ambient file `apps/loom/src/app/types/declarations.d.ts`:

```ts
declare module '@appwrite.io/pink';
declare module '@appwrite.io/pink-icons';
```

_Alternative considered:_ importing the CSS entry file directly (`@appwrite.io/pink/dist/pink.css`), which would match the existing `declare module '*.css'` wildcard. Rejected — it couples the app to the packages' internal file layout; the bare-specifier import is the documented usage and the ambient declaration is the standard fix for typeless side-effect packages.

### D5 — `core-baseline-health` spec is repaired by direct edit, not a spec delta

Delta operations (ADDED/MODIFIED/REMOVED/RENAMED) model _requirement_ changes; there is no delta operation for adding a `## Purpose` section or renaming a malformed top-level header, and routing this through MODIFIED would falsely record a behavior change at archive time. The repair is a direct edit to `openspec/specs/core-baseline-health/spec.md`: write a Purpose section (the project's obligation that `@loom-js/core` compiles, its tests load and type-check, and no debug logging ships) and change `## ADDED Requirements` → `## Requirements`. Requirement and scenario text are untouched.

### D6 — Audit report closure

After the refactor lands and core tests pass, the `get-attr-update.ts` entry in `SOLID-AUDIT-REPORT.md` is updated to ✅ Resolved following the `solid-audit` skill's conventions (entry preserved, status flipped, resolution noted) — per the repo's Audit Rule this happens in the same change, not a follow-up.

## Risks / Trade-offs

- **[Hot-path regression in attribute updates]** → The refactor is mechanical (same updaters, same bind-time state, same precedence); it is guarded by `pnpm -F @loom-js/core test-ci` (including the reactive attr-binding specs) plus `type-check` and `type-check-tests`. No new allocations on the update path — factories run once at template-parse time, exactly where `.bind()` runs today.
- **[Precedence drift between map and fallbacks]** → D2 fixes the lookup order to mirror the switch's case order; the existing test suite exercises `$on`, `$props`, `$attrs`, and event attrs.
- **[`hosts[0]` empty in exotic serve configs]** → Explicit `?? 'localhost'` fallback; dev-only code path, worst case is a cosmetic log line.
- **[Spec repair drifts from archived change history]** → The repair is formatting-only and the archived delta under `changes/archive/` remains the historical record; requirement text is byte-identical.

## Open Questions

None — all three items are fully scoped.
