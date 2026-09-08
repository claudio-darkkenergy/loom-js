# Tasks — dehydrated-state-envelope

## 1. TDD

- [ ] 1.1 Red: serialize emits `{ __loom: 1, state }` (escaping intact, round-trip exact); prime accepts v1, rejects bare objects & unknown versions with one warning each and zero primed keys; rejected boot still fetches normally (existing unprimed scenarios stay green)
- [ ] 1.2 Green: envelope in `serializeState` (`dehydrate.ts`), validation in `primeResources` (`resource.ts`), `SerializedStateEnvelope` in `types.ts`; `type-check` + `type-check-tests` green

## 2. Docs

- [ ] 2.1 README + topic 12: XSS-footgun line gains the enforcement sentence & the not-a-trust-layer boundary; verify the client snippet needs no shape change; re-push draft

## 3. Release

- [ ] 3.1 **Minor** changeset naming the behavior change (un-enveloped payloads no longer prime); note for `diagnostics-output-quality` warning anatomy if landed
