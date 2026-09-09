# Tasks — effect-content-swap-performance

## 1. Reproduce & pin (TDD)

- [ ] 1.1 Red: templating specs — different-template swap tears down + builds fresh (no incumbent node reuse), same-template update path untouched (existing suite must stay green), perf guard per D3
- [ ] 1.2 Locate the slot update fork in `lib/templating/` and confirm the measured walk is the reconciler crossing unrelated trees (profile note in the change)

## 2. Implement

- [ ] 2.1 Green: template-identity discriminant (D1) routing unrelated swaps through teardown + fresh build (D2); full core suite + type-checks green
- [ ] 2.2 Re-measure the docs reproduction against built core (linkedom probe or local app): cached-revisit swap in the ~150ms class

## 3. Release

- [ ] 3.1 **Minor** changeset noting the behavior boundary (unrelated-content DOM state no longer accidentally preserved); note the docs-app follow-up (drop the forced-skeleton workaround) as a separate change
