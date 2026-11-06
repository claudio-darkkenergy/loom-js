import { toJson } from '../json';
import type { RenderContext } from './context';

const PATHS = { '@app/*': ['./src/*'] };

// The private `@loom-js/typescript-config` app options, inlined.
export const COMPILER_OPTIONS = {
    esModuleInterop: true,
    isolatedModules: true,
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    moduleDetection: 'force',
    moduleResolution: 'Bundler',
    noEmit: true,
    noUncheckedIndexedAccess: true,
    resolveJsonModule: true,
    skipLibCheck: true,
    strict: true,
    target: 'ES2022'
};

/** The app's `tsconfig.json` or `jsconfig.json`, by path. */
export const renderCompilerConfig = ({
    choices
}: RenderContext): Record<string, string> => {
    if (choices.js) {
        return {
            'jsconfig.json': toJson({
                compilerOptions: {
                    module: 'ESNext',
                    moduleResolution: 'Bundler',
                    paths: PATHS,
                    target: 'ES2022'
                },
                include: ['src', 'loom.config.mjs']
            })
        };
    }

    const include = ['src', 'loom.config.ts'];

    return {
        'tsconfig.json': toJson(
            choices.layout === 'monorepo'
                ? {
                      extends: '../../tsconfig.base.json',
                      compilerOptions: { paths: PATHS },
                      include
                  }
                : {
                      compilerOptions: { ...COMPILER_OPTIONS, paths: PATHS },
                      include
                  }
        )
    };
};
