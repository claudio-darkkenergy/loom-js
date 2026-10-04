---
'@loom-js/core': patch
---

The package's `llms-full.txt` carries only core's topics: a docs topic that names another workspace in its front matter (`package: @loom-js/pink`) is left out, and extra front-matter keys no longer fail the build.
