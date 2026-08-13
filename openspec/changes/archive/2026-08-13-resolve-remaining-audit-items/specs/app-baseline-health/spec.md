## ADDED Requirements

### Requirement: Loom app type-checks cleanly

`pnpm -F @loom-js/loom type-check` SHALL complete with zero TypeScript errors. App source and build scripts SHALL NOT reference properties that do not exist on their dependencies' current type surfaces.

#### Scenario: type-check reports no errors

- **WHEN** `pnpm -F @loom-js/loom type-check` is run
- **THEN** it exits successfully with zero reported TypeScript errors

#### Scenario: dev script tracks the current esbuild serve API

- **WHEN** `project/client/dev.mts` is compiled
- **THEN** it reads `hosts` and `port` from esbuild's `ServeResult` (the removed `host` property is not referenced)
- **AND** the logged dev-server URL handles an empty `hosts` array with an explicit fallback rather than an unchecked index

### Requirement: CSS-only third-party packages have ambient declarations

Side-effect imports of packages that ship no JavaScript or type declarations (e.g. CSS-only design-system packages) SHALL resolve through ambient module declarations in the app's declaration file, so the imports compile without `TS2882` errors.

#### Scenario: Appwrite Pink side-effect imports compile

- **WHEN** `src/app/bootstrap.ts` imports `@appwrite.io/pink` and `@appwrite.io/pink-icons` for their side effects
- **THEN** both imports resolve via `declare module` entries in `src/app/types/declarations.d.ts`
- **AND** the type-check reports no missing-declaration errors for either package
