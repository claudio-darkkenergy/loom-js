## ADDED Requirements

### Requirement: The build topic documents the shipped build pipeline

The docs SHALL expose a `build-tool` topic at `/docs/build-tool` covering the blessed build path — the esbuild entrypoints, `htmlSplit` shell generation (route scoping and dynamic chunks), and the prerender pipeline — accurate to the tooling actually shipped in the repo at authoring time.

#### Scenario: Topic resolves with pipeline coverage

- **WHEN** a user navigates to `/docs/build-tool` after this change lands
- **THEN** the topic renders content covering the build entrypoints, HTML shell generation, and prerendering as shipped

#### Scenario: Tooling changes prompt a docs touch

- **WHEN** `esbuild-plugin-html-split` or the app build entrypoints change consumer-visible behavior the topic describes
- **THEN** the topic is updated in the same effort, mirroring the README topics' drift obligation
