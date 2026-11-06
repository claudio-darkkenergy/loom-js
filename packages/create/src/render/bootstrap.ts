import type { RenderContext } from './context';

/** The browser entry: dev reload, kit stylesheets, then `init` or prime + `hydrate`. */
export const renderBootstrap = ({ choices, uiKit }: RenderContext) => {
    const stylesheets = (uiKit?.stylesheets ?? []).filter(
        // With Tailwind, the kit's main sheet is imported by `styles.css`.
        (sheet) => !(choices.tailwind && sheet === uiKit?.tailwind.stylesheet)
    );
    const coreImport = choices.spa
        ? "import { APP_ROOT_ID, init } from '@loom-js/core';"
        : [
              'import {',
              '    APP_ROOT_ID,',
              '    hydrate,',
              '    primeResources,',
              '    STATE_SCRIPT_ID',
              "} from '@loom-js/core';"
          ].join('\n');
    const boot = choices.spa
        ? ['init({ app: App(), root: document.getElementById(APP_ROOT_ID) });']
        : [
              '// A prerendered page embeds its state; prime it so nothing refetches.',
              'const payload = document.getElementById(STATE_SCRIPT_ID)?.textContent;',
              '',
              'if (payload) {',
              '    primeResources(JSON.parse(payload));',
              '}',
              '',
              'hydrate({ app: App(), root: document.getElementById(APP_ROOT_ID) });'
          ];

    return [
        coreImport,
        ...stylesheets.map((sheet) => `import '${sheet}';`),
        '',
        "import { App } from './app';",
        '',
        '// Reloads the page when `loom dev` rebuilds; production builds drop it.',
        'if (__DEV__) {',
        "    new EventSource('/esbuild').addEventListener('change', () =>",
        '        location.reload()',
        '    );',
        '}',
        '',
        ...boot,
        ''
    ].join('\n');
};
