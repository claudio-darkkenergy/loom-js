# Design — docs-feedback-topic

## Context

The nav and prev/next pagination derive entirely from the `/docs` page entry's `content[]` order; adding a topic is a listing edit plus entry content. The `feedback` entry exists, published, slug `feedback`, body "Coming soon". The align change's parity contract covers the 13 README-mapped topics.

## Goals / Non-Goals

**Goals:** a genuinely useful feedback page; tail placement that doesn't dilute the learning path; zero app-code change.

**Non-Goals:** feedback forms or backend (links out to GitHub); README coverage (this topic is deliberately outside the parity set).

## Decisions

### D1 — Tail of the nav, after `diagnostics`, pagination included

Trailing utility topics sit after the learning path; `feedback` last (a natural end-of-docs call to action). Pagination derives from the listing, so `diagnostics → feedback` prev/next appears with no authored data — acceptable and arguably good (finish the path, land on "tell us how it went").

### D2 — Body links out, doesn't collect

GitHub issues (bugs, API friction), discussions/repo for questions, and a short "what helps at this stage" note (API-surface feedback while pre-1.0). No forms, no email. Keeps the page evergreen.

### D3 — Reuse the existing entry

Same entry id and slug (`feedback`) — deep links and entry history preserved; body replaced via the `contentful-sync` draft flow, maintainer reviews before publish.

## Risks / Trade-offs

- [Trailing topics blur the learning path] → the IA delta names the boundary explicitly: mapped set first, in order; utilities after.

## Open Questions

None.
