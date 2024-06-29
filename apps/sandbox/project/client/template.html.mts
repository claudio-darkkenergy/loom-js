import { HtmlTemplateArgs } from 'esbuild-plugin-html-split';

export const htmlTemplate = (args: HtmlTemplateArgs) => `
<!DOCTYPE html>
<html>
<head>
    <title>Sandbox</title>
    <meta charset="utf-8" />
${args.common.css
    .concat(args.css)
    .map((path) => `    <link href="${path}" rel="stylesheet" />`)
    .join('\n')}
${args.common.js
    .filter((js) => new RegExp(`^(${args.scope}|\/chunk)`).test(js))
    .concat(args.js)
    .map((path) => `    <script defer src="${path}" type="module"></script>`)
    .join('\n')}
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
</body>
</html>
`;
