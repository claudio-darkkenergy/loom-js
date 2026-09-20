# Tasks — dehydrated-state-envelope

## 1. TDD

- [x] 1.1 Red: serialize emits `{ __loom: 1, state }` (escaping intact, round-trip exact); prime accepts v1, rejects bare objects & unknown versions with one warning each and zero primed keys; rejected boot still fetches normally (existing unprimed scenarios stay green)
- [x] 1.2 Green: envelope in `serializeState` (`dehydrate.ts`), validation in `primeResources` (`resource.ts`), `SerializedStateEnvelope` in `types.ts` (exported via index); `type-check` + `type-check-tests` green; `apps/loom` bootstrap retyped to the envelope (318 browser / 50 server tests green)

## 2. Docs

- [x] 2.1 README + topic 12: XSS-footgun line gains the enforcement sentence & the not-a-trust-layer boundary; client snippet verified unchanged in shape; topic entry `4v0zEJ280WojOoIsRyhwpd` re-pushed as draft (v133 over published v131)

## 3. Release

- [x] 3.1 **Minor** changeset naming the behavior change (un-enveloped payloads no longer prime); `diagnostics-output-quality` has not landed, so no warning-anatomy note applies
