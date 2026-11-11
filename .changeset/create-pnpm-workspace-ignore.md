---
'@loom-js/create': patch
---

The formatter leaves `pnpm-workspace.yaml` alone. pnpm rewrites that file in its own style (after `pnpm approve-builds`, or when it adds a release-age exclusion during install), which made `format:check` fail on a fresh pnpm app.
