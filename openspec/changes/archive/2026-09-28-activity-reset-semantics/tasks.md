# Tasks — activity-reset-semantics

## 1. Tests

- [x] 1.1 Activity specs pinning the shipped behavior — transformed reset restores baseline without calling the transform (sinon spy), baseline reset is a notification no-op, idle reset is synchronous and adds no pending settlement work
- [x] 1.2 Lane specs — reset retires an in-flight run under `'latest'`, lands in dispatch order under `'ordered'`, queues under `'serial'`; `type-check` + `type-check-tests` green

## 2. Docs

- [x] 2.1 README + topic 07 `reset` bullets describe the transform bypass and the run dispatch; re-push draft if topic 07 is behind the README

## 3. Release

- [x] 3.1 **Patch** changeset naming the behavior on transformed activities and the `reset()` → `update(<initial input>)` migration for anyone relying on the old trip
