// The prebuilt HUD, inlined at build time (`scripts/build.mjs`): its script
// bundles its own core, pink components and app; its style carries pink's
// stylesheet and the HUD's own rules.
declare const __LOOM_DEVTOOLS_FRONTEND_SCRIPT__: string;
declare const __LOOM_DEVTOOLS_FRONTEND_STYLE__: string;

/** The complete HUD document, for a frame's `srcdoc` or a popup. */
export const frontendDocument = () => `<!doctype html>
<html lang="en" class="theme-dark">
<head>
<meta charset="utf-8" />
<title>loom devtools</title>
<style>${__LOOM_DEVTOOLS_FRONTEND_STYLE__}</style>
</head>
<body>
<div id="loom-devtools-hud"></div>
<script type="module">${__LOOM_DEVTOOLS_FRONTEND_SCRIPT__}</script>
</body>
</html>`;
