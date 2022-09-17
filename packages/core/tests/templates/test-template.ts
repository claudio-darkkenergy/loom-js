export const testTemplate = ({ publicPath, title }) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
    </head>
    <body>
      <div id="test-app">
          Loading the test application...
      </div>
      <script src="${publicPath}/index.js" type="text/javascript"></script>
    </body>
  </html>
`;
