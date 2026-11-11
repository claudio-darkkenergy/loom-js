# Tasks

## 1. Footer year

- [x] 1.1 In `apps/loom/src/app/pages/layout.ts`, replace the `© 2024` literal with `© ${new Date().getFullYear()}`. Verify with `pnpm -F @loom-js/loom type-check` and by checking that `grep -rn "2024" apps/loom/src` no longer matches the footer.
- [x] 1.2 In the prerender `validate` hook in `apps/loom/loom.config.ts`, throw on any route whose `html` lacks `© <current year></footer>` (anchored to the footer, since the pink-layout and pink-composition topics quote `© 2026` in code samples), with a `[prerender]` message naming the route. Run the check before the per-route early returns so `/` and `/benchmarks` are covered. Verify by temporarily expecting the wrong year and confirming the build fails on the first route, then reverting.

## 2. End-to-end check

- [x] 2.1 Run an isolated production build (`pnpm -F @loom-js/loom build -- --outDir <scratch>` with `.env.local` loaded) and confirm it passes `validate`. Then grep the emitted `index.html`, a docs topic and `benchmarks/index.html` for `© 2026`.
- [x] 2.2 Serve that build, load `/` and one docs topic in Chrome, and confirm the footer reads `© 2026` after hydration. Fake a 2027 clock (DevTools time override, or `Date` stubbed before boot) and confirm the footer reads `© 2027` once the client tree swaps in, while view-source still shows `© 2026`.
- [x] 2.3 Run `pnpm format:check` and `pnpm -F @loom-js/loom test-ci`, and confirm both pass. No changeset: `@loom-js/loom` is private.
