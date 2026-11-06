import {
    BASE_STYLESHEET,
    type RenderContext,
    TAILWIND_OUTPUT
} from './context';

const LINE_WIDTH = 80;

// An array of strings inline when its line fits, one per line otherwise —
// how both formatters print it.
const stringArray = (
    key: string,
    values: readonly string[],
    indent: string
) => {
    const quoted = values.map((value) => `'${value}'`);
    const inline = `${indent}${key}: [${quoted.join(', ')}],`;

    return inline.length <= LINE_WIDTH
        ? inline
        : `${indent}${key}: [\n${quoted
              .map((value) => `${indent}    ${value}`)
              .join(',\n')}\n${indent}],`;
};

/** `loom.config.ts` (or `.mjs`): no type syntax, so one text serves both. */
export const renderLoomConfig = ({ choices, name, uiKit }: RenderContext) => {
    const styles = choices.tailwind
        ? [BASE_STYLESHEET, TAILWIND_OUTPUT]
        : [BASE_STYLESHEET];
    const html = [
        ...(uiKit?.bodyClass
            ? [`        bodyClass: '${uiKit.bodyClass}',`]
            : []),
        `        title: () => '${name}'`
    ];
    const prerender = choices.spa
        ? []
        : [
              '    prerender: {',
              "        entry: './src/prerender.entry',",
              '        routes: () => routes',
              '    },'
          ];

    return [
        "import { defineConfig } from '@loom-js/build';",
        '',
        "import { routes } from './src/routes';",
        '',
        'export default defineConfig({',
        "    entry: './src/bootstrap',",
        '    html: {',
        ...html,
        '    },',
        ...prerender,
        '    routes,',
        stringArray('styles', styles, '    ').replace(/,$/, ''),
        '});',
        ''
    ].join('\n');
};
