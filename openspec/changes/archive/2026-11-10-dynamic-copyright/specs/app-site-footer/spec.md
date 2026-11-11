# Spec Delta

## Purpose

Defines what the loom app's site footer shows on every route, starting with the copyright notice, so footer content stays current without hand edits.

## ADDED Requirements

### Requirement: The copyright year is the current year

The site footer SHALL read `© <year>`, where `<year>` is the four-digit calendar year at the time the footer renders. The year SHALL NOT come from a literal in source or from Contentful, so no edit or content publish is needed when the year turns over.

#### Scenario: Client render shows the visitor's year

- **WHEN** a visitor loads any route and the client app finishes booting
- **THEN** the footer reads `©` followed by the current year from the visitor's clock

#### Scenario: A page built last year reads correctly after boot

- **WHEN** the prerendered HTML was built in 2026 and a visitor opens it in 2027
- **THEN** the served markup reads `© 2026` and the footer reads `© 2027` once the client tree replaces it

### Requirement: Prerendered pages carry the build year

Every prerendered route SHALL include the footer with the year the build ran, so crawlers and no-JS visitors see a copyright notice that is current as of the last deploy.

#### Scenario: Production build

- **WHEN** the loom app is built with prerender in 2026
- **THEN** the footer in each emitted route's HTML reads `© 2026`
