# Contentful sync (phase 4 record)

What was entered into the `Loom JS` space (`2x238mu87414`, env `master`) for task 4.2, and the
tooling that entered it. `topics/*.md` are the authored sources (README → map outline);
`md2rich.py` converts them to rich-text JSON per the map's conventions; `push.py` creates/updates
the entries **as drafts** (it never publishes). `ids.json` maps slug → entry id.

Re-run: `python3 push.py [--dry]` from this directory (reads the CMA token from the personal
profile's Contentful MCP config; needs `curl`). Slugs in `ids.json` update in place.

Code samples are re-indented 4→2 spaces at push time (`reindent`). Entered 2026-08-28: 10 created, 3 updated in place (`components`, `activities`, `routing`).
Not yet done: `/docs` page listing (`1voqtWKFf2dQZWLfpnOYgd`) reorder, retiring the six
pre-scrub topics (task 4.3), publishing.
