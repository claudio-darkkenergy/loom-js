# Adopt Pink Source

## Why

`@loom-js/pink` is a component layer over `@appwrite.io/pink` and `@appwrite.io/pink-icons`, and both are dead ends: the upstream repo (appwrite/pink) is archived at 1.0.0, its docs home redirects to appwrite.io, and Appwrite's current design system is internal. Every style the package renders comes from a dependency nobody will fix or extend, and consumers have to install and import a second vendor's packages to make ours work. Taking the source in-house makes pink a self-contained design system we can change.

## What Changes

- The upstream stylesheet source (`packages/ui/src`, 103 SCSS files) and icon set (`packages/icons`: 358 SVGs plus the built icon font) are copied into `packages/pink` from appwrite/pink at its archived head (`bfc9ba1`, version 1.0.0), with the upstream MIT notice and provenance recorded.
- `@loom-js/pink` builds and ships its own stylesheet and icon font: `build-package` compiles the SCSS to `dist/pink.css`; new exports `@loom-js/pink/pink.css` and `@loom-js/pink/icons.css`.
- **BREAKING**: `@appwrite.io/pink` and `@appwrite.io/pink-icons` are removed from pink's dependencies. Consumers replace `import '@appwrite.io/pink'` / `import '@appwrite.io/pink-icons'` with the two `@loom-js/pink` stylesheet imports. No alias or compatibility entry.
- The first adopted build is output-equivalent to upstream 1.0.0 — no visual change in this change. Pruning unused upstream components, restyling, and regenerating the icon font are follow-ups.
- `apps/loom`, `apps/sandbox` and pink's Storybook switch to the new imports; `apps/loom` drops its direct `@appwrite.io/*` dependencies and their ambient module declarations.
- **Package name: stays `@loom-js/pink`** (recommended; see design D1 — open for maintainer confirmation before apply). The `Pink*` export prefix is unchanged either way.

## Capabilities

### New Capabilities

- `pink-owned-styles`: pink owns, builds and exports its stylesheet and icon font with no Appwrite package dependency; adoption parity with upstream 1.0.0; upstream attribution.

### Modified Capabilities

- `docs-component-sourcing`: the "port from upstream appwrite/pink" path becomes "build a loom component over the styles already in `packages/pink`"; the per-component maintainer approval gate is unchanged.
- `app-baseline-health`: the ambient-declaration requirement for CSS-only third-party packages is removed — the app no longer imports any.

## Impact

- `packages/pink` — new `scss/` and `icons/` trees, `sass` + reset packages as devDependencies, `build-package` script, `exports`, `NOTICE`, README-level description; minor changeset (0.x breaking convention).
- `apps/loom`, `apps/sandbox`, `packages/pink/.storybook` — stylesheet imports; `apps/loom/package.json` and `declarations.d.ts` cleanup.
- Docs — `CLAUDE.md`, `.claude/skills/skill-config.md` (dependency + convention change), root `.git-blame-ignore-revs` (the reformat commit).
- `openspec/changes/docs-pink-section` — its overview wording ("relationship to `@appwrite.io/pink`") becomes "origin"; adjust when that change is picked up.
- npm — nothing to deprecate if the name stays; a rename would add a deprecation of `@loom-js/pink` pointing at the new name.
