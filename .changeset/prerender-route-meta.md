---
'@loom-js/build': minor
---

Add the `prerender.meta(route, output, bundle)` hook. It returns a prerendered route's own `title` and `description`, which the tool writes into that route's `<title>`, `og:title`, `<meta name="description">` and `og:description`.
