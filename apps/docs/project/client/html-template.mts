import { HtmlTemplateArgs } from 'esbuild-plugin-html-split';

export const htmlTemplate = ({
    common,
    css,
    define,
    js,
    scope
}: HtmlTemplateArgs) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>${define.getTitle ? define.getTitle(js) : ''}</title>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
${common.css
    .filter(
        (path) =>
            new RegExp(`${scope}.css$`).test(path) ||
            (scope === '/pages' && /\/index.css$/.test(path))
    )
    .concat(css)
    .map((path) => `    <link href="${path}" rel="stylesheet" />`)
    .join('\n')}
${common.js
    .filter((path) => new RegExp(`^(${scope}|\/chunk)`).test(path))
    .concat(js)
    .map((path) => `    <script src="${path}" type="module"></script>`)
    .join('\n')}
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
</body>
</html>
`;
