'use strict';

/**
 * Two TypeScript majors coexist in this repo deliberately.
 *
 * Every workspace type-checks and builds on typescript@^7 (the Go-native
 * port). The tools below embed the LEGACY compiler API
 * (ts.createSourceFile / ScriptTarget / createProgram) that TypeScript 7 no
 * longer exports from its main entry, so under a TS7 resolution they crash
 * at runtime (e.g. prettier: `Cannot read properties of undefined
 * (reading 'Latest')`). They use TypeScript purely as a parser/emitter —
 * their TypeScript has no bearing on how the repo type-checks.
 *
 * Neither a `tool>typescript` override nor a packageExtensions dependency
 * can fix this: `typescript` is a PEER of these tools, and pnpm resolves
 * peers from the dependent workspace's context — which is now always 7.x —
 * before consulting either mechanism (verified 2026-08-02). This hook is the
 * supported escape hatch: it removes `typescript` from each tool's
 * peerDependencies and gives the tool its own nested typescript 6 as a real
 * dependency instead.
 *
 * Removal condition, per tool: delete its entry the moment it ships
 * TypeScript 7 support. All four are on their latest published versions as
 * of 2026-08-02. See
 * openspec/changes/archive/2026-08-02-fix-prettier-import-sorting/.
 */
const LEGACY_TS_API_TOOLS = new Set([
    'prettier-plugin-sort-imports',
    'rollup-plugin-dts',
    '@rollup/plugin-typescript',
    'ts-node'
]);

const TS6 = '^6.0.2';

function readPackage(pkg) {
    if (LEGACY_TS_API_TOOLS.has(pkg.name)) {
        if (pkg.peerDependencies) {
            delete pkg.peerDependencies.typescript;
        }
        if (pkg.peerDependenciesMeta) {
            delete pkg.peerDependenciesMeta.typescript;
        }
        pkg.dependencies = { ...pkg.dependencies, typescript: TS6 };
    }
    return pkg;
}

module.exports = { hooks: { readPackage } };
