## ADDED Requirements

### Requirement: The html-split plugin is a published `@loom-js` package

The plugin SHALL be published as `@loom-js/esbuild-plugin-html-split` with a compiled `dist/` (ES + CJS + `index.d.ts`), `exports` pointing at the build output, `esbuild` as a peer dependency, and no `private` flag — usable from a raw esbuild config without `@loom-js/build`.

#### Scenario: Standalone consumption

- **WHEN** an esbuild config outside this repo imports `htmlSplit` from `@loom-js/esbuild-plugin-html-split`
- **THEN** the import resolves to compiled JavaScript with types and the plugin emits shells as it does for the workspace apps

#### Scenario: Release flow

- **WHEN** the change lands on `main`
- **THEN** changesets versions and publishes the package alongside the other `@loom-js/*` packages

### Requirement: The plugin documents its own contract

The package SHALL ship a README covering every `HtmlSplitPluginOptions` field, the `HtmlTemplateArgs` the template receives (common/dynamic/route CSS/route assets), and the chunk-classification rules a template relies on.

#### Scenario: README stands alone

- **WHEN** a reader has only the npm package page
- **THEN** they can write a working `template` without reading the loom apps' source

### Requirement: Workspace consumers import the scoped name

Every workspace reference to `esbuild-plugin-html-split` SHALL use the scoped package name; the unscoped name is gone.

#### Scenario: No unscoped references

- **WHEN** the tree is searched for `'esbuild-plugin-html-split'` as a bare specifier
- **THEN** only the package's own manifest `name` matches
