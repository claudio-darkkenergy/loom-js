## ADDED Requirements

### Requirement: The shell boot contract is a core export

`@loom-js/core` SHALL export the shell boot contract — `APP_ROOT_ID`, `STATE_SCRIPT_ID`, `appRootSlot`, `stateScriptSlot` — from its main entry, and `injectPrerender(shellHtml, { appHtml, stateJson })` from `@loom-js/core/server`, so shell templates, prerender injectors and the client boot agree on the slots without sharing app code.

#### Scenario: Injector fills both slots

- **WHEN** `injectPrerender` is given a shell containing both slot literals
- **THEN** the app root carries the markup and the state script carries the JSON, with `$` sequences in either payload preserved verbatim

#### Scenario: Drifted shell throws

- **WHEN** `injectPrerender` is given a shell missing either slot literal
- **THEN** it throws naming the missing boot slot

#### Scenario: Client boot reads the same ids

- **WHEN** the client boot looks up the state script and app root
- **THEN** it uses `STATE_SCRIPT_ID` / `APP_ROOT_ID` imported from `@loom-js/core`
