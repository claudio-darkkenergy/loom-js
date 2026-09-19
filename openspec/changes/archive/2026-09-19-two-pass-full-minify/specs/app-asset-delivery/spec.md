# app-asset-delivery Delta

## MODIFIED Requirements

### Requirement: Production output contains no dev-only code

Development instrumentation — the esbuild live-reload `EventSource`, framework debug logging, and sourcemaps — SHALL be excluded from production build output via build-time elimination, not runtime checks. Production bundles SHALL be fully minified — whitespace, syntax, and identifiers — with css-module class names identical between the emitted JavaScript and every emitted stylesheet.

#### Scenario: No live-reload connection in production

- **WHEN** the production bundle is built and served
- **THEN** no request to `/esbuild` is made and the string `EventSource('/esbuild')` does not appear in the output

#### Scenario: No debug logging in production

- **WHEN** the production app boots
- **THEN** framework debug console output is disabled and the debug configuration is absent from the bundle

#### Scenario: Identifiers are minified and css-module names agree

- **WHEN** a css-module selector is read from an emitted route stylesheet
- **THEN** the identical class string appears in the corresponding JavaScript, and no `stem_name`-form module classes remain in the output
