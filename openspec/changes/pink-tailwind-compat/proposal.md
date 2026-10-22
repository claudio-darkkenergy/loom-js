# Proposal

## Why

`@loom-js/pink` should drop into a Tailwind CSS v4 app and just work. Today it doesn't. The blocker isn't `classnames`. It's the cascade: `pink.css` declares top-level layers named `components` and `utilities`, which merge into Tailwind's layers of the same names. Whichever stylesheet loads second also appends its leftover layers after the other's. With pink first, Tailwind's preflight (`base`) lands after every pink layer and flattens pink's buttons, padding and borders. With Tailwind first, pink's `resets` and `elements` land after Tailwind's `utilities`, so utility classes lose to pink. Swapping `classnames` for `clsx` is still worth doing, since it's the smaller drop-in Tailwind projects already use, but on its own it fixes nothing.

## What Changes

- Replace pink's `classnames` dependency with `clsx`. The call shape is the same. `clsx` is imported only by a new internal helper, `src/utils/cn.ts`, and the 39 modules switch their import to that helper, so a future swap touches one file. `cva` isn't adopted: pink's boolean props (`isSecondary`, `isBig`…) already are the variant API, and `cva` gives consumers nothing Tailwind needs.
- **BREAKING** (pre-1.0, minor changeset): `pink.css` nests its whole cascade (`css-variables` … `utilities`) inside one top-level `pink` layer, and opens with a layer-order statement that places `pink` between Tailwind's `base` and `components`. If pink is imported before `tailwindcss`, preflight resets come first, pink styles the elements next, and Tailwind utilities override pink. Non-Tailwind consumers see the same relative cascade. The only CSS affected is consumer CSS that writes into pink's inner layer names (`@layer components { … }`), which no longer merges into pink's layers.
- New private workspace example, `apps/examples/pink-tailwind`: a single page built with `@loom-js/build` that styles pink components with Tailwind utilities and documents the setup.
- The pink overview docs topic picks up the new layer structure and a Tailwind section: import order, the class-name collisions (`container`, `list-item`, `table`, `table-row`) and how to exclude those candidates.
- `apps/loom` doesn't change. It keeps its own `classnames` dependency.

## Capabilities

### New Capabilities

- `pink-tailwind-compatibility`: pink and Tailwind CSS v4 coexist in one app. The cascade order holds, utilities override pink, preflight doesn't flatten pink, and a workspace example proves it.

### Modified Capabilities

- `pink-owned-styles`: the stylesheet's layer structure changes. Every pink rule now sits under one `pink` layer, so the "component patches are part of the stylesheet" scenario now names `pink.components`.

## Impact

- `packages/pink`: `package.json` (dependency swap), `rollup.config.ts` (externals, lib tsconfig), `tsconfig.json` → solution over `tsconfig.lib.json` + `tsconfig.node.json` (fixes pre-existing editor type errors in the tooling files), the new `src/utils/cn.ts`, 39 `src/**` modules (import only, including the uncommitted `pink-modal` from `docs-search`), `scss/_index.scss` (layer wrap + order statement).
- `pnpm-lock.yaml`: adds `clsx`. `classnames` stays for `apps/loom` and `apps/docs`.
- New workspace `apps/examples/pink-tailwind`, plus a `devDependency` on `tailwindcss` / `@tailwindcss/cli` scoped to it. Its `package.json` joins `.prettierrc` `packageJSONFiles`.
- `docs/topics/17-pink.md` (+ Contentful push and publish), `docs/pink-content-map.md` source pointers.
- `.changeset`: `@loom-js/pink` minor.
