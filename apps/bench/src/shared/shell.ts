// The HTML each framework's page is served from. One template, one set of
// static assets; only the script path differs.
export const shellHtml = (scriptPath: string) => `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>bench</title>
        <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
        <div id="app"></div>
        <script type="module" src="${scriptPath}"></script>
    </body>
</html>
`;
