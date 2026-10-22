---
'@loom-js/pink': minor
---

Pink now works alongside Tailwind CSS v4. Every rule in `pink.css` sits in one top-level `pink` layer, and the stylesheet opens with `@layer theme, base, pink, components, utilities;`. If you import `pink.css` before `tailwindcss`, Tailwind's preflight runs first and its utilities override pink. Without Tailwind, the cascade is the same as before.

Breaking: CSS that wrote into pink's layer names (`@layer components { … }`) to slot into pink's cascade now creates its own top-level layer after `pink`. Move those rules into `@layer pink.components { … }`, or leave them unlayered.

Class composition now uses `clsx` in place of `classnames`, so the runtime dependency changes. Class output is unchanged.
