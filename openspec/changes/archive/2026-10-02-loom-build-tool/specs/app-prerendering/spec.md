## MODIFIED Requirements

### Requirement: Production builds emit prerendered HTML per route

The loom app's production build SHALL emit a fully rendered static `index.html` for the home route and for every published docs topic, produced by `@loom-js/build`'s prerender phase — `renderToString` against a fresh injected window per route with the route's URL installed, the same render path the client runs — through the app's `prerender` hooks in `loom.config.ts`, not an app-owned build runner.

#### Scenario: Home route prerendered

- **WHEN** `loom build` completes in production mode
- **THEN** `build/index.html` contains the rendered home markup inside the app root element, not an empty shell

#### Scenario: Docs topics prerendered

- **WHEN** `loom build` completes in production mode
- **THEN** every published topic slug has a `build/docs/<slug>/index.html` containing that topic's rendered content

### Requirement: Prerendered routes are discovered from the content source

The docs route set SHALL be enumerated at build time from the Contentful page listing (the same listing the side nav renders) by the app's `prerender.routes` hook — no hardcoded slug list in the build tool or the config.

#### Scenario: New topic published

- **WHEN** a topic is added in Contentful and a build runs
- **THEN** the new topic's route is prerendered with no app code change
