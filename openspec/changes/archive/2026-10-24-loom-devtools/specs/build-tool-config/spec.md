# Spec Delta

## ADDED Requirements

### Requirement: The devtools key controls devtools availability per mode

The config SHALL accept `devtools: 'dev' | 'lazy' | false`, defaulting to `'dev'`. `'dev'` SHALL make devtools available in development builds only, `'lazy'` in development and production builds, `false` in none. Where available, devtools code SHALL load only when switched on, adding nothing to any route's initial bundle.

#### Scenario: Default in production

- **WHEN** an app without a `devtools` key is built in production mode
- **THEN** `loom.devtools.enable()` warns that devtools is not registered, and no devtools code is in the output

#### Scenario: Lazy in production

- **WHEN** an app with `devtools: 'lazy'` is built in production mode
- **THEN** initial route bundles carry no devtools code, and `loom.devtools.enable()` loads it on demand

### Requirement: Name injection follows devtools availability

The build SHALL inject component display names exactly when devtools is available for the build's mode and `@loom-js/devtools` is installed.

#### Scenario: Production without lazy

- **WHEN** an app with the default `devtools` is built in production mode
- **THEN** no component names are injected into the output

### Requirement: A missing devtools package is handled by intent

With `devtools` left at its default and `@loom-js/devtools` not installed, the build SHALL proceed without devtools. With `devtools` explicitly set to `'dev'` or `'lazy'` and the package not installed, the build SHALL fail with a message naming the missing dependency.

#### Scenario: Default without the package

- **WHEN** an app that never installed `@loom-js/devtools` is built in development
- **THEN** the build succeeds, no component names are injected, and `loom.devtools.enable()` warns with the registration remedy

#### Scenario: Explicit without the package

- **WHEN** an app sets `devtools: 'lazy'` without installing `@loom-js/devtools`
- **THEN** the build fails naming `@loom-js/devtools`
