# @loom-js/eslint-plugin

ESLint rules enforcing the [loom-js](https://github.com/claudio-darkkenergy/loom-js) element-syntax authoring convention. The rules are **enforcers, not codemods** — none of them autofix; they report the places where a template strays from the convention (or will throw at runtime) and tell you what to write instead.

## Install

```sh
npm install --save-dev eslint @loom-js/eslint-plugin
```

Requires eslint ≥ 9 (flat config only — there is no legacy `.eslintrc` shim).

## Usage

`loom.configs.recommended` is self-contained — it registers the plugin under the `loom` namespace and enables both rules at `error`:

```js
// eslint.config.js
import loom from '@loom-js/eslint-plugin';

export default [loom.configs.recommended];
```

Downgrade individual rules if you want advisory mode:

```js
export default [
    loom.configs.recommended,
    {
        rules: {
            'loom/prefer-element-syntax': 'warn'
        }
    }
];
```

## Rules

### `loom/prefer-element-syntax`

Element syntax is the primary authoring surface. A **direct** component call interpolated in **child position** of a loom template is reported — a component tag serves there:

```js
// ✗ flagged
const Page = ({ html }) => html`
    <div>${Chip({ label })}</div>
`;

// ✓ what it suggests
const Page = ({ html }) => html`<div><${Chip} label=${label}></${Chip}></div>`;
```

The functional form is reserved for **value positions**, and those are spared by construction:

```js
// ✓ attribute values (is=, any prop)
html`
    <div is=${Chip}></div>
`;
html`<${Layout} header=${Header({ compact: true })}></${Layout}>`;

// ✓ array items & callback returns — the interpolation is the `.map` call
html`
    <ul>
        ${items.map((item) => Chip({ label: item }))}
    </ul>
`;

// ✓ effect hooks & region variables
html`
    <div>${locationEffect(cb)}</div>
`;
html`
    <div>${children}</div>
`;

// ✓ conditionals are non-direct — deliberately spared
html`
    <div>${cond ? Chip({}) : Card({})}</div>
`;

// ✓ global constructor-likes
html`
    <div>${String(value)}</div>
`;
```

**Options** (`loom/prefer-element-syntax`: `["error", { … }]`):

- `tagNames` (default `["html"]`) — which tagged-template identifiers count as loom templates. The renderer param is named `html` by strong convention; if your codebase renames it, widen this list. A renamed tag the option doesn't cover is a documented false negative.
- `ignoreNames` (default `[]`) — additional capitalized callees to spare, on top of the built-in global constructor-likes (`String`, `Number`, `Boolean`, `Array`, `Object`, `Date`, `Symbol`, `BigInt`). A capitalized non-component helper called directly in child position violates the naming convention the rule assumes — list it here.

### `loom/no-dollar-props-on-component-tags`

`$`-prefixed attributes (`$click`, `$attrs`, …) have **element-only** meaning. On a component tag the runtime throws at first render — this rule catches it at lint time instead:

```js
// ✗ flagged — throws at first render
html`<${Button} $click=${handler}>Go</${Button}>`;

// ✓ pass it through the component's props instead
html`<${Button} onClick=${handler}>Go</${Button}>`;

// ✓ $ attributes on plain elements are the supported form
html`
    <button $click=${handler}>Go</button>
`;
```

Also takes the `tagNames` option (see above).

## Deferred: array-composition constraints

Two convention constraints are **not** enforced in v1, because they need flow/cross-file analysis a syntactic rule can't do honestly:

1. Regions interpolate directly — they must not travel as array items.
2. Array-consumed components stay off component-tag roots.

Both remain documentation-level guidance; the runtime is the enforcement of record.

## GritQL mirror (Biome users)

The published package ships a lint-only [GritQL](https://docs.grit.io/) pattern in `grit/` as a courtesy mirror of the textually-expressible rule:

- `grit/no-dollar-props-on-component-tags.grit`

`prefer-element-syntax` has **no** GritQL mirror — it needs the child-vs-attribute-position distinction, which is beyond an honest textual pattern. There is no parity promise: the pattern approximates its eslint counterpart textually, and **eslint is the full-fidelity surface**. The pattern performs no rewrite.

## No autofixes

By policy (the convention shipped with in-repo migration done by hand, and enforcement is installable rather than imposed), no rule provides an autofix or suggestion edit. The reports name the correct form; the change is yours to make.
