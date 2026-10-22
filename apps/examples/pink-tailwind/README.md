# Pink + Tailwind

A one-page loom app that renders `@loom-js/pink` components and restyles them with Tailwind CSS v4 utilities. It builds with `@loom-js/build`; the Tailwind CLI compiles the stylesheet first.

## Run it

```bash
pnpm -F @loom-js/example-pink-tailwind dev      # http://localhost:1003
pnpm -F @loom-js/example-pink-tailwind build    # writes build/
pnpm -F @loom-js/example-pink-tailwind test-ci  # build + cascade checks in headless Chrome
```

Pink's `dist/pink.css` must exist first. A root `pnpm build` or `pnpm build-packages` takes care of that.

## The stylesheet

```css
@import '@loom-js/pink/pink.css';
@import 'tailwindcss';

@source not inline('container list-item table table-row');
```

Import pink before Tailwind. `pink.css` opens with `@layer theme, base, pink, components, utilities;`, so Tailwind's preflight comes before pink and Tailwind's utilities come after it. A utility class on a pink component wins, and an unstyled component looks the same as it does without Tailwind.

`container`, `list-item`, `table` and `table-row` are pink classes that Tailwind also generates as utilities. The `@source not inline(...)` line stops Tailwind from generating them, so pink keeps those names.

Pink's tokens are CSS variables, which Tailwind's arbitrary values can read. The heading uses `text-[hsl(var(--color-primary-100))]`.

## Editor note

VS Code's built-in CSS linter flags `@source` as an unknown at-rule. With the Tailwind CSS IntelliSense extension, map the file to its language mode in your workspace settings:

```json
"files.associations": { "*.css": "tailwindcss" }
```

## Dev note

`dev` runs two watchers: the Tailwind CLI rewrites `.generated/styles.css`, and `loom dev` rebuilds when it changes. After editing a class name, the new utility can show up a moment after the JS rebuild.
