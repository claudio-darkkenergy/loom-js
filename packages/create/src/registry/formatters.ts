import { toJson } from '../json';
import type { Formatter } from './types';

// Generated output, lockfiles and pnpm-workspace.yaml (pnpm rewrites it in
// its own style) stay unformatted.
const IGNORED = [
    'build',
    '.generated',
    'package-lock.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'yarn.lock',
    'bun.lock'
];

export const biome: Formatter = {
    checkCommand: ['biome', 'check'],
    devDependencies: ['@biomejs/biome'],
    files: ({ ignored }) => ({
        'biome.json': toJson({
            // The installed version's schema, so it never drifts from the tool.
            $schema: './node_modules/@biomejs/biome/configuration_schema.json',
            assist: {
                actions: {
                    source: {
                        organizeImports: {
                            level: 'on',
                            options: {
                                groups: [
                                    [
                                        ':NODE:',
                                        ':PACKAGE:',
                                        ':PACKAGE_WITH_PROTOCOL:'
                                    ],
                                    ':BLANK_LINE:',
                                    [':ALIAS:', ':PATH:']
                                ]
                            }
                        }
                    }
                }
            },
            css: {
                formatter: { quoteStyle: 'single' },
                parser: { tailwindDirectives: true }
            },
            files: {
                includes: [
                    '**',
                    ...[...IGNORED, ...ignored].map((path) => `!**/${path}`)
                ]
            },
            formatter: { indentStyle: 'space', indentWidth: 4, lineWidth: 80 },
            javascript: {
                formatter: {
                    quoteStyle: 'single',
                    semicolons: 'always',
                    trailingCommas: 'none'
                }
            },
            linter: { enabled: false },
            yaml: { formatter: { quoteStyle: 'single' } }
        })
    }),
    fixCommand: ['biome', 'check', '--write'],
    id: 'biome',
    label: 'Biome'
};

export const prettier: Formatter = {
    checkCommand: ['prettier', '--check', '.'],
    devDependencies: ['prettier'],
    files: ({ ignored }) => ({
        '.prettierignore': `${[...IGNORED, ...ignored].join('\n')}\n`,
        '.prettierrc': toJson({
            semi: true,
            singleQuote: true,
            tabWidth: 4,
            trailingComma: 'none'
        })
    }),
    fixCommand: ['prettier', '--write', '.'],
    id: 'prettier',
    label: 'Prettier'
};

/** The first entry is the default. */
export const FORMATTERS: readonly Formatter[] = [biome, prettier];
