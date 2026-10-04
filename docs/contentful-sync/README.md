# Contentful sync

The docs topics are authored in `docs/topics/*.md` and pushed to Contentful from here. Moved out of the `align-loom-docs-with-core-readme` change (2026-09-28); the notes below are that change's record.

What was entered into the `Loom JS` space (`2x238mu87414`, env `master`) for task 4.2, and the
tooling that entered it. `../topics/*.md` are the authored sources (README → map outline);
`md2rich.py` converts them to rich-text JSON per the map's conventions; `push.py` creates/updates
the entries **as drafts** (it never publishes). `ids.json` maps slug → entry id.

Re-run: `python3 push.py [--dry] [slug ...]` from this directory (reads the CMA token from the
personal profile's Contentful MCP config; needs `curl`). Slugs in `ids.json` update in place; pass
slugs to push only those topics.

Code samples are re-indented 4→2 spaces at push time (`reindent`). Entered 2026-08-28: 10 created, 3 updated in place (`components`, `activities`, `routing`). `14-feedback.md` joined 2026-09-20 (`docs-feedback-topic` — a trailing utility topic outside the 13-topic parity set, mapped to the pre-existing `feedback` entry). `15-build-tool.md` joined 2026-10-02 (`docs-build-tool-topic`; a fresh entry — the old `build-tools` relic was gone — placed in the Reference group between `diagnostics` and `feedback`). `16-app-structure.md` joined 2026-10-03 (`docs-app-structure-topic`; anchored on `apps/loom`, placed in the Reference group between `diagnostics` and `build-tool`).
All 17 entries are published and grouped on the `/docs` page (`1voqtWKFf2dQZWLfpnOYgd`). The
pre-scrub topic drafts and every pre-2026 relic entry (old site/page/video entries) were deleted
2026-09-30; the space now holds exactly the 17 topics, the 5 nav groups and the `/docs` page.
