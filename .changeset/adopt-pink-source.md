---
'@loom-js/pink': minor
---

Pink now ships its own stylesheet and icon font. The Pink Design 1.0 source was adopted from the archived appwrite/pink repository (`scss/`, `icons/`, see `NOTICE`), and `build-package` compiles it to `dist/pink.css`. The compiled output matches `@appwrite.io/pink@1.0.0`, so nothing changes visually.

**Breaking:** `@appwrite.io/pink` and `@appwrite.io/pink-icons` are no longer dependencies, and the `@loom-js/pink/styles/*` stylesheets (`code-panel-tabs`, `code-tokens`, `side-nav`) are now part of `pink.css`. Replace all of those imports with:

```ts
import '@loom-js/pink/icons.css';
import '@loom-js/pink/pink.css';
```
