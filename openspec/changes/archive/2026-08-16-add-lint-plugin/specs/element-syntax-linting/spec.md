# element-syntax-linting — delta

## ADDED Requirements

### Requirement: Direct component-call interpolations in child positions are reported

The `prefer-element-syntax` rule SHALL report a template interpolation inside a loom template (a tagged template whose tag matches the configured `tagNames`, default `['html']`) when the interpolation sits in child position and its expression is a direct call of a component-shaped callee (capitalized identifier or member ending in one, excluding configured `ignoreNames` and known global constructor-likes). Sanctioned value positions SHALL NOT be reported.

#### Scenario: a direct component call in child position is flagged

- **WHEN** a loom template contains `${Chip({ label })}` between markup tags
- **THEN** the rule reports the interpolation, suggesting a component tag

#### Scenario: attribute-value positions are spared

- **WHEN** a loom template contains `is=${Chip}` or any `prop=${Component({ … })}` attribute value
- **THEN** the rule reports nothing for that interpolation

#### Scenario: array items and callback returns are spared

- **WHEN** a loom template contains `${items.map((item) => Chip({ label: item }))}`
- **THEN** the rule reports nothing — the interpolation's expression is the `.map` call, not a direct component call

#### Scenario: effect hooks and region variables are spared

- **WHEN** a loom template contains `${locationEffect(cb)}`, `${children}`, or `${slots?.header}`
- **THEN** the rule reports nothing

#### Scenario: global constructor-likes are spared

- **WHEN** a loom template contains `${String(value)}` or another configured/default-ignored capitalized call
- **THEN** the rule reports nothing

#### Scenario: non-loom tagged templates are ignored

- **WHEN** a file contains `css\`…\``or another tagged template whose tag is not in`tagNames`
- **THEN** the rule reports nothing anywhere in that template

### Requirement: Dollar-prefixed props on component tags are reported

The `no-dollar-props-on-component-tags` rule SHALL report each `$`-prefixed attribute inside a component element's open tag in a loom template — the construct the runtime rejects on first render — while `$` attributes on plain elements SHALL NOT be reported.

#### Scenario: a $ prop on a component tag is flagged

- **WHEN** a loom template contains `<${Button} $click=${handler}>`
- **THEN** the rule reports the `$click` attribute, naming the `onClick`-style prop form instead

#### Scenario: $ attributes on plain elements pass

- **WHEN** a loom template contains `<button $click=${handler}>`
- **THEN** the rule reports nothing

### Requirement: The plugin exposes an eslint 9 flat-config surface

The package SHALL export an eslint 9 plugin object — `meta`, the two rules, and a self-contained `recommended` flat config registering the plugin under the `loom` namespace with all rules at `error`.

#### Scenario: recommended config activates the rules

- **WHEN** a consumer spreads `loom.configs.recommended` into `eslint.config.js`
- **THEN** `loom/prefer-element-syntax` and `loom/no-dollar-props-on-component-tags` run at `error` with no further wiring

### Requirement: A lint-only GritQL mirror ships with the package

The package SHALL ship a GritQL pattern file mirroring the textually-expressible rule (`no-dollar-props-on-component-tags`) for Biome users, lint-only, with the mirror's scope (no `prefer-element-syntax`, no parity promise) documented.

#### Scenario: the pattern is present and rewrite-free

- **WHEN** the published package is inspected
- **THEN** `grit/` contains the pattern, performing no rewrite

#### Scenario: the scope note is documented

- **WHEN** the package README is read
- **THEN** it states which rules the GritQL mirror covers and that eslint is the full-fidelity surface
