# Tasks — component-instance-state

## 1. Red (TDD)

- [ ] 1.1 Instance-survival spec (the 2026-09-07 probe: parent re-render via effect, factory invoked once, state preserved); per-instance isolation; unmount release; overrun/underrun debug warning; SSR window isolation

## 2. Green

- [ ] 2.1 Generalize the `memoizedRefContext` pattern to a per-context value store + iterator; wire the utility into the props object (`UtilityProps`); settle the name (D2) against the red specs
- [ ] 2.2 Full suite + type-checks; bundle delta noted

## 3. Docs & release

- [ ] 3.1 README + activities topic: the Disclosure example gains the surviving variant; boundary paragraph rewritten to "choose your scope"; `document-component-refs`'s Built-in props section gains the utility (coordinate if unapplied)
- [ ] 3.2 Pink copy-button comment corrected ("closure is the instance" → conditional truth, or adopt the utility)
- [ ] 3.3 **Minor** changeset
