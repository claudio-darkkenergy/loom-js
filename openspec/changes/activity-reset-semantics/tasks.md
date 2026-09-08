# Tasks — activity-reset-semantics

## 1. TDD

- [ ] 1.1 Red: activity specs — transformed reset restores baseline without calling the transform (sinon spy), baseline reset is a notification no-op, reset registers nothing with settlement, untransformed reset unchanged
- [ ] 1.2 Green: `reset` targets the internal committer in `activity.ts` (rename the shadowing internal `update` to `commit` while there); `type-check` + `type-check-tests` green

## 2. Docs

- [ ] 2.1 README + topic 07 `reset` bullets: "restores the starting value directly, bypassing any transform — subject to the same change comparison as any commit"; re-push draft

## 3. Release

- [ ] 3.1 **Minor** changeset naming the behavior change on transformed activities and the `reset()` → `update(<initial input>)` migration for anyone relying on the old trip
