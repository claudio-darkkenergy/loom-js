// Dependency ranges stamped by `scripts/build.mjs`: `@loom-js/*` as carets of
// the workspace versions, third-party tools as this package's own ranges.
declare const __STAMPED_RANGES__: Record<string, string>;

export const STAMPED_RANGES: Readonly<Record<string, string>> =
    __STAMPED_RANGES__;

/** The range a scaffolded app declares for `name`. */
export const rangeOf = (name: string) => {
    const range = STAMPED_RANGES[name];

    if (!range) {
        throw new Error(`[create] no stamped range for "${name}".`);
    }

    return range;
};
