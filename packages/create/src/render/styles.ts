import type { RenderContext } from './context';

/** Tailwind's input stylesheet: the kit first (it declares the layer order). */
export const renderTailwindStyles = ({ uiKit }: RenderContext) => {
    if (!uiKit) {
        return "@import 'tailwindcss';\n";
    }

    return [
        `/* ${uiKit.label} first: its layer order puts Tailwind's preflight`,
        "   before the kit and Tailwind's utilities after it. */",
        `@import '${uiKit.tailwind.stylesheet}';`,
        "@import 'tailwindcss';",
        ...(uiKit.tailwind.sourceExclusions.length > 0
            ? [
                  '',
                  '/* Kit classes Tailwind would also generate as utilities. */',
                  `@source not inline('${uiKit.tailwind.sourceExclusions.join(' ')}');`
              ]
            : []),
        ''
    ].join('\n');
};
