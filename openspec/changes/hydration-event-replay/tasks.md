# Tasks — hydration-event-replay

## 1. TDD

- [ ] 1.1 Red: hydrate specs — early click honored once (order: swap → lifecycle sweep → replay → `onAppMounted`); submit prevented & replayed; anchor pass-through; unresolvable path drops with warning; FIFO across mixed types; off-by-default attaches nothing; `isTrusted` false on replays
- [ ] 1.2 Green: replay module in the hydrate graph (capture per D3, index-path recording per D2, dispatch per D4, queue cap); `replayEvents` on `HydrateProps` in `types.ts`
- [ ] 1.3 Tree-shake audit: `init`-only bundle unchanged (extends the pay-nothing requirement); `type-check` + `type-check-tests` green

## 2. Docs

- [ ] 2.1 README Client Hydration + topic 11: `replayEvents` in the API list, pre-swap inertness bullet gains the opt-in, The swap notes replay timing, caveat on `isTrusted`/analytics; re-push draft

## 3. Release

- [ ] 3.1 **Minor** changeset; if `diagnostics-output-quality` has landed, the warnings use its line anatomy
