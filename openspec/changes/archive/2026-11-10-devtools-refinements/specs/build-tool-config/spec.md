# Spec Delta

## MODIFIED Requirements

### Requirement: Name injection follows devtools availability

The build SHALL inject component display names and activity labels exactly when devtools is available for the build's mode and `@loom-js/devtools` is installed.

#### Scenario: Production without lazy

- **WHEN** an app with the default `devtools` is built in production mode
- **THEN** no component names or activity labels are injected into the output

#### Scenario: Development with the package

- **WHEN** an app with `@loom-js/devtools` installed is built in development mode
- **THEN** both component names and activity labels are injected
