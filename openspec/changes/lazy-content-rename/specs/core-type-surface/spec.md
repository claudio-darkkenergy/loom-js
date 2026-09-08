## MODIFIED Requirements

### Requirement: Lazy imports return a typed activity

`lazyImport<ImportType>` SHALL declare its return type as the concrete activity instantiation for its import — `LazyImportActivity<ImportType>`, defined as `ReturnType<typeof activity<ImportType | undefined, () => Promise<ImportType>>>` and exported from the module — and both the cache-hit and cache-miss paths SHALL return that type, so consumers receive `ImportType | undefined` values from `effect`, `watch`, and `value()` without narrowing or casts. `lazyContent` SHALL be typed as `LazyImportActivity<ContextFunction | undefined>`; `importLazy` MAY remain only as a deprecated transitional alias of `lazyContent`, scheduled for removal.

#### Scenario: effect values are typed on the cache-miss path

- **WHEN** a first `lazyImport<Component>('key', importer)` call's activity is consumed via `effect(({ value }) => …)` under type-checking
- **THEN** `value` is typed `Component | undefined` and truthiness narrowing suffices to call it — no `typeof` narrowing or cast is required

#### Scenario: cache-hit path carries the same type

- **WHEN** a repeat `lazyImport<Component>('key', importer)` call returns the cached activity under type-checking
- **THEN** its static type equals the first call's `LazyImportActivity<Component>` — `value()` is `Component | undefined`, not `unknown`

#### Scenario: lazyContent is typed for renderable content

- **WHEN** `lazyContent(path, importer)` is consumed under type-checking
- **THEN** it presents `LazyImportActivity<ContextFunction | undefined>`

#### Scenario: the transitional alias matches exactly

- **WHEN** `importLazy` is still exported during the alias window
- **THEN** it is the same function as `lazyContent`, carries a deprecation tag naming the replacement, and first-party code does not use it
