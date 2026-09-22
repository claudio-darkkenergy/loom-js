# Tasks — docs-feedback-topic

## 1. Content

- [x] 1.1 Author the feedback body in `contentful-sync/topics/` (issues link, discussions, "what helps while pre-1.0"); push as a draft to entry `wQLhRMdC2tGF2CgJPAOSN` (v13 after phrasing review); maintainer reviews — Discussions was disabled at authoring; maintainer enabled it, verified live 2026-09-21
- [x] 1.2 Append the entry to the `/docs` page listing after `diagnostics` (draft — listing entry v18, published version still 16)

## 2. Verification & release

- [x] 2.1 Publish entry + listing together with (or after) the align change's phase-4 publish — published 2026-09-21 (maintainer-approved scope: the full standing draft set, 14 topics + listing v18, so the live docs caught up to core 0.13 in the same publish); `vercel redeploy` of loom-js-loom picked the content up
- [x] 2.2 Verify: nav shows it last, selected state works, `diagnostics ↔ feedback` prev/next derives, `/docs/feedback` renders the new body — verified live 2026-09-21 on loom-js-docs.vercel.app: 14 nav entries with Feedback last, `is-selected` on Feedback only, diagnostics `rel=next` → feedback / feedback `rel=prev` → diagnostics, new body rendered with Issues/Discussions links opening `_blank` + `noopener noreferrer`
