# Design

## Context

`scss/_index.scss` declares `@layer css-variables, resets, icons, animations, elements, components, grids, utilities;` at the top level. Tailwind v4's `index.css` declares `@layer theme, base, components, utilities;` and puts preflight in `base`. Two of the names are shared, so the two stylesheets merge into one layer list whose order depends on load order. Neither order works (see proposal.md, Why).

Pink composes classes in 39 modules with `classNames(className, '<block>', { 'is-x': isX })`. Nothing in pink reads `classnames`-only behaviour (no `dedupe`/`bind` variants, no `toString` objects).

`@loom-js/build` turns each `styles` entry into an esbuild CSS entry point. esbuild bundles `@import`s and `url()`s but doesn't run PostCSS, so a raw `@import "tailwindcss"` would inline Tailwind's directives without processing them.

## Goals / Non-Goals

**Goals:**

- Import order alone is enough for Tailwind consumers: pink first, then `tailwindcss`. No config.
- Non-Tailwind consumers keep the same relative cascade.

**Non-Goals:**

- No Tailwind preset, plugin or theme mapping of pink's tokens. Pink's `--p-*` variables stay usable from Tailwind through arbitrary values (`bg-(--p-color-primary)`), and the example shows that once.
- No built-in Tailwind support in `@loom-js/build`. The example uses Tailwind's own CLI.
- Tailwind v3 isn't covered. It has no native cascade layers.

## Decisions

**1. `clsx`, not `cva`, not `classnames`.** `clsx` accepts the same arguments (strings, objects, arrays, falsy), so this is an import swap. It's ~240 B against ~400 B and has types built in. `cva` builds variant maps from string props, but pink's API is boolean props over Appwrite's `is-*` modifier classes, and changing that is a consumer-facing rewrite that does nothing for Tailwind. `tailwind-merge` was ruled out too: pink's classes aren't Tailwind utilities, so there's nothing for it to merge, and rewriting consumer classes would break the "reach the DOM as written" requirement. `clsx` is imported in one place, `src/utils/cn.ts`, which re-exports it as `cn` (the name Tailwind projects use for the same helper) and isn't in pink's public index. Components import the helper and call sites keep their shape (`cn(className, 'button', {...})`), and swapping the library later is a one-file change. `rollup.config.ts` lists `clsx` as external in place of `classnames`.

**2. Wrap the whole cascade in `@layer pink` and prepend a Tailwind-shaped order statement.** `_index.scss` becomes:

```scss
@layer theme, base, pink, components, utilities;

@layer pink {
    @layer css-variables, resets, icons, animations, elements, components, grids, utilities;
    @layer css-variables { … }
    …
}
```

When pink loads first, the top-level order is fixed as theme → base (preflight) → pink → components → utilities. Tailwind's own order statement repeats names that are already ordered, so it changes nothing. Pink's inner `components` / `utilities` are now `pink.components` / `pink.utilities` and can't merge with Tailwind's.

Alternatives considered:

- _Wrap only, no order statement._ This avoids naming Tailwind's layers in pink, but with pink first preflight lands after pink, so the consumer has to hand-write the order statement. That fails the "import order alone" goal.
- _Separate `@loom-js/pink/tailwind.css` entry_ (`@import "./pink.css" layer(pink)` plus the order statement). pink.css stays untouched, but it's a second entry to know about and still collides when someone imports plain `pink.css`. Fixing the stylesheet itself is simpler.
- _Rename pink's inner layers_ (`pink-components`…). Same isolation, but less clear than nesting, and it still leaves preflight ordering to the consumer.

The empty `theme` / `base` / `components` / `utilities` layers cost nothing in non-Tailwind apps and hold no rules.

**3. Class-name collisions are documented, not renamed.** `container`, `list-item`, `table` and `table-row` are both pink classes and Tailwind utilities (from a Tailwind build fed every class selector in `dist/pink.css`). With the new order, a Tailwind `.container` (max-width per breakpoint) overrides pink's `.container` whenever the token shows up in a scanned source. Renaming pink classes breaks the Appwrite class vocabulary and every consumer's markup. The docs show `@source not inline('container list-item table table-row');` instead. Task 3.3 re-runs the check against a real Tailwind build.

**4. The example uses `@loom-js/build` + the Tailwind CLI.** It dogfoods loom's tool and needs no plugin code:

```
src/styles.css ──tailwindcss CLI──▶ .generated/styles.css ──loom build (styles entry)──▶ static/styles/styles.css
  @import '@loom-js/pink/pink.css';
  @import 'tailwindcss';
  @source not inline('container list-item table table-row');
```

`build` = `tailwindcss -i … -o … && loom build`. `dev` runs `tailwindcss --watch=always` next to `loom dev`. A plain `--watch` exits at once, because the backgrounded job's stdin is `/dev/null` and Tailwind's watcher stops when stdin closes. `icons.css` is still imported from the entry module, as in `apps/loom`, so esbuild handles its font `url()`s.

Alternatives: Vite + `@tailwindcss/vite` is the mainstream path, but it bypasses loom's build tool. An esbuild plugin over `@tailwindcss/node` sits on a package whose API Tailwind doesn't document for third parties.

**5. Cascade proof is a puppeteer `node --test` in the example.** It builds, serves `build/`, and asserts computed styles: a `bg-red-500` `PinkButton` has Tailwind's red, an unclassed `PinkButton` has non-zero padding and pink's background, and a `PinkTag` class list carries the consumer's utilities. The dev dependency is `puppeteer`, the same major `apps/bench` uses. The package is named `@loom-js/example-pink-tailwind` and stays private.

## Risks / Trade-offs

- [Consumer CSS that writes `@layer components { … }` to slot into pink's cascade now creates a separate top-level layer that sits after `pink`] → No workspace consumer does this (`grep '@layer'` over apps/lib finds none). Call it out in the changeset as the breaking surface.
- [Pink's stylesheet names Tailwind's layers] → They're empty and inert without Tailwind. If Tailwind renames its layers in a later major, the order statement needs updating. The example's test catches that on a Tailwind bump.
- [Tailwind CLI's import inlining could rebase or mangle `pink.css` `url()`s] → pink.css has no font urls (those live in icons.css, which goes through esbuild). Task 3 checks the generated file anyway.
- [`dev` runs two watchers, so a style edit can land a beat after a JS rebuild] → Acceptable for an example. Documented in its README.

## Migration Plan

Ships as a pink minor. Consumers that only import `pink.css` do nothing. The changeset names the `@layer` breaking surface. Rollback means reverting the `_index.scss` wrap. The `clsx` swap is independent and safe to keep.
