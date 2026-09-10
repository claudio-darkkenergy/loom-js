# Tasks — settlement-scroll-restoration

## 1. TDD

- [x] 1.1 Red: router specs — offset capture on push/replace exit, `{ restore }` replay after settle on reload-shaped boot and popstate, fragment-outranks-restore, no-state top fallback, `scroll: false` untouched; update the existing "traversal left to the browser" assertions the clause inversion breaks
- [x] 1.2 Green: PendingScroll `{ restore }` (D1), exit capture (D2), manual restoration at construction (D3); full core suite + type-checks green

## 2. Docs & spec sync

- [x] 2.1 README routing section + Routing topic: replace the "history traversal is left to the browser's own scroll restoration" sentence with the settlement-exact contract; re-push draft
- [x] 2.2 Verify against the production reproduction (deep scroll → reload → exact offset)

## 3. Release

- [x] 3.1 **Minor** changeset
