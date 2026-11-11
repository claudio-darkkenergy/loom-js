# app-release-status Specification

## Purpose

Defines how the loom app tells visitors the framework's maturity and which `@loom-js/core` release the site documents, so neither is hand-maintained.

## Requirements

### Requirement: The header marks the framework as beta

The site header SHALL show a "Beta" badge beside the brand logo on every route, at every viewport width.

#### Scenario: Desktop route

- **WHEN** a visitor opens `/`, `/docs/<topic>` or `/benchmarks` on a desktop viewport
- **THEN** the header shows the brand logo followed by a "Beta" badge

#### Scenario: Mobile route

- **WHEN** a visitor opens any route on a mobile viewport
- **THEN** the "Beta" badge is still shown beside the brand logo

### Requirement: The header shows the documented core version

The site header SHALL show the `@loom-js/core` version the site was built against, as `v<version>` (for example `v0.22.0`), beside the beta badge. The version SHALL link to `https://www.npmjs.com/package/@loom-js/core` and open in a new tab. It SHALL be shown at every viewport width.

#### Scenario: Version on any viewport

- **WHEN** the site was built with `@loom-js/core` at `0.22.0` and a visitor opens any route on a desktop or mobile viewport
- **THEN** the header reads `v0.22.0` beside the beta badge
- **AND** activating it opens the core package's npm page in a new tab

### Requirement: The version follows core's manifest

The displayed version SHALL come from the `version` field of the `@loom-js/core` package manifest the app builds against. It SHALL NOT be a literal in app source, a Contentful field, or a runtime registry request. A core release SHALL show on the site at the next build with no app edit.

#### Scenario: Core release

- **WHEN** the Version Packages merge bumps `@loom-js/core` from `0.22.0` to `0.23.0` and the site rebuilds
- **THEN** the header reads `v0.23.0` with no change to the loom app's source

#### Scenario: Unreadable manifest

- **WHEN** the build cannot read core's manifest, or its `version` is not a semver string
- **THEN** the build fails with an error naming the manifest path

### Requirement: Prerendered pages carry the badge and version

Every prerendered route SHALL include the beta badge and the version in its served HTML. A production build SHALL fail when any route renders without the version.

#### Scenario: Production build

- **WHEN** the loom app is built with prerender against `@loom-js/core` `0.22.0`
- **THEN** every emitted route's HTML contains the "Beta" badge and `v0.22.0`

#### Scenario: A route drops the version

- **WHEN** a prerendered route's HTML does not contain `v<version>`
- **THEN** the build fails naming that route
