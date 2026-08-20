// Compile-time assertions for the lazy-import type surface
// (`core-api-follow-ups` design Decisions 4 & 5) — covered by
// `type-check-tests`; never executed.
import { importLazy, lazyImport } from '../../src';
import type { LazyImportActivity } from '../../src';
import type { Component, ContextFunction } from '../../src/types';

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false;
type Expect<T extends true> = T;

declare const componentImporter: () => Promise<Component>;

const cacheMiss = lazyImport<Component>('type-assert', componentImporter);
const cacheHit = lazyImport<Component>('type-assert', componentImporter);

// Both cache paths present the same concrete activity instantiation.
export type AssertCacheMissTyped = Expect<
    Equal<typeof cacheMiss, LazyImportActivity<Component>>
>;
export type AssertCacheHitTyped = Expect<
    Equal<typeof cacheHit, LazyImportActivity<Component>>
>;

// Values flow as `Component | undefined` — truthiness narrowing suffices to
// call them; no `typeof` narrowing or cast required.
export const assertEffectValueTyped = cacheMiss.effect(({ value }) => {
    const valueTyped: Expect<Equal<typeof value, Component | undefined>> = true;

    return valueTyped && value && value();
});

export const assertWatchValueTyped = cacheHit.watch(({ value }) => {
    const valueTyped: Expect<Equal<typeof value, Component | undefined>> = true;

    return valueTyped && value && value();
});

// `importLazy` is the renderable-content instantiation — its `@TODO` is
// resolved by contract.
export type AssertImportLazyTyped = Expect<
    Equal<
        ReturnType<typeof importLazy>,
        LazyImportActivity<ContextFunction | undefined>
    >
>;
