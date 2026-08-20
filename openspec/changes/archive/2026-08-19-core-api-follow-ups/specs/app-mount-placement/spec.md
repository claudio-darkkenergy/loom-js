# app-mount-placement — delta

## ADDED Requirements

### Requirement: Boot mount position is a placement mode

`init` SHALL express the app node's mount position through `AppInitProps.placement`, a string-literal union `'replace' | 'append' | 'prepend'` defaulting to `'replace'`: `'replace'` replaces the root's existing children, `'append'` inserts after them, `'prepend'` inserts before them. The internal mount seam (`lib/mount.ts`) SHALL take the same union, and the former `append?: boolean | null` prop SHALL no longer exist on the public contract.

#### Scenario: default placement replaces

- **WHEN** `init({ app, root })` runs with no `placement` against a root carrying existing children
- **THEN** the app node replaces the root's children

#### Scenario: append placement preserves existing children

- **WHEN** `init({ app, root, placement: 'append' })` runs against a root carrying existing children
- **THEN** the app node lands after the existing children, which remain untouched

#### Scenario: prepend placement inserts first

- **WHEN** `init({ app, root, placement: 'prepend' })` runs against a root carrying existing children
- **THEN** the app node lands before the existing children, which remain untouched

#### Scenario: the boolean prop is gone

- **WHEN** a caller passes `append` to `init` under type-checking
- **THEN** the compiler rejects the unknown prop
