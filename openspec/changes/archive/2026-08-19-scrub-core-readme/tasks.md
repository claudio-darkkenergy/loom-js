# Tasks — scrub-core-readme

## 1. Audit

- [x] 1.1 Build the export checklist: list every export of `src/index.ts` (values + types) and `src/server.ts`, and mark each as documented / undocumented / internal-leaning against the current README
- [x] 1.2 Verify every documented signature, option, and default in the README against source (Bootstrapping, Components, element syntax, element components, custom elements, Activities, Routing, SSR, hydration, dehydration, diagnostics) — note each drift with file:line
- [x] 1.3 Record the deliberate-exclusion list (internal-leaning exports and reasons) in the change directory for review

## 2. Activities section rewrite

- [x] 2.1 Document the full signature `activity<V, I = V>(initialValue, transformOrOptions?, options?)`: transforms (`{ input, update, value }`, async transforms tracked by `settled()`), and the `deep` / `force` options
- [x] 2.2 Complete the Returns shape: `bind`, `effect`, `initialValue` (frozen), `reset()`, `update(input, forceUpdate?)`, `value()` (shallow-copy semantics), `watch`
- [x] 2.3 Fix stale prose and typos ("introducted"; the "unchanged throughout the life" wording) and cross-link the settlement/dehydration sections to the transform docs
- [x] 2.4 Fix the Activity example (unclosed `<span>`, missing closing brace/paren, `${ label }` spacing) and extend it or add a transform example

## 3. Components & Bootstrapping corrections

- [x] 3.1 Document all five lifecycle hooks with timing in the Components concept; correct the "two life-cycle methods" claim and the Life Cycles example (including `/` comments)
- [x] 3.2 Complete `AppInitProps` docs (`append`, `globalConfig`, `root` default) and fix the `init` Quick Example syntax error
- [x] 3.3 Fix the `node()` example's malformed comment

## 4. Missing & stale coverage

- [x] 4.1 Add documentation for `simple()` / `SimpleComponent`
- [x] 4.2 Add documentation for `lazyImport` / `importLazy`
- [x] 4.3 Cover the public config surface (`globalConfig` boot shape, `appendEvents` if judged public) per the audit's include/exclude list
- [x] 4.4 Replace the `PrerenderSsgWebpackPlugin` bootstrapping example with the current `renderToString` SSG idiom; drop `npm i -S`
- [x] 4.5 Reconcile Feature Highlights and every **Inclusion** line with the actual export map

## 5. Verification

- [x] 5.1 Extract every code example into a scratch file and type-check it against the workspace `tsc` (fix any that fail)
- [x] 5.2 Full read-through pass for internal consistency (cross-references, terminology, voice per design decision 6)
- [x] 5.3 Run `pnpm format:check` (or `pnpm format`) so the README passes CI; decide/add the changeset per the design's open question
