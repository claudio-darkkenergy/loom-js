# Design

## Context

`htmlParser` joins a template's statics with the placeholder token and parses the result, so an attribute slot parses as `name="⚡"`. `compilePlan` finds dynamic attributes by the token in their value, classifies each by name, and removes only the special ones; a plain attribute stays in the cached fragment with the token, and every clone copies it. Chrome validates SVG attribute values on parse and on clone and logs an error for each invalid one. HTML attributes have no value grammar, which is why only SVG shows it.

## Goals / Non-Goals

**Goals:**

- No attribute is ever parsed or cloned with the placeholder as its value.
- Authored attribute names, including SVG's mixed-case ones, survive unchanged.

**Non-Goals:**

- Partial attribute interpolation (`class="a ${b}"`), which core doesn't support today.
- Any change to text and comment slots, which already parse as their own text nodes.

## Decisions

**D1. Strip every dynamic attribute from the cached fragment.** The plan already records each attribute's name and kind, and the slot sets the attribute during wiring, before the instance is inserted, so nothing can observe it missing. This removes the per-instance errors and saves copying an attribute every clone would overwrite. It also lets the style updater drop its guard against a placeholder surviving an empty value.

**D2. Parse attribute slots under marker names.** When joining the statics, a chunk that ends in an attribute name and `=` (quoted or not) has that tail written as a marker attribute instead: the token followed by the slot's ordinal, with no value. An unknown attribute name is never validated, and a distinct name per slot means the parser never drops one as a duplicate. The plan matches markers by ordinal and takes the authored name from the chunk tail, so `viewBox` keeps its case without an SVG name-adjustment table. Alternatives: keep the value placeholder and accept one error per template per document, which still logs on every page load; or pick a placeholder that passes validation, which no single value does across SVG's length, path and list grammars.

**D3. One reading of the chunk tail.** The element-syntax compiler and the table-scope scan already read chunk tails. The attribute-name match lives in one helper used by the parser, with unit specs for quoted, unquoted, `$`-prefixed and namespaced (`xlink:href`) names.

## Risks / Trade-offs

- [A chunk tail that looks like an attribute but sits in text, like `` html`<p>a=${b}</p>` ``] → The helper only matches inside an open tag, using the same open-tag tracking the table-scope scan relies on; a spec covers text that ends in `=`.
- [Server rendering parses with linkedom] → linkedom never validated values, so it gains nothing but must accept marker names; the server-rendering specs run unchanged.
