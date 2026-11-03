# Design

## Context

- `html.title(scope)` and `html.head(args)` run once per shell, and prerendered topics reuse the `/docs` shell, so every topic inherits its head.
- `injectPrerender` fills only the markup and state slots. Nothing rewrites the head per route.
- The client never sets `document.title`.
- The brand generator renders PNGs through headless Chrome, so text needs a font that is present at render time.

## Decisions

- **The hook lives in the build tool, not the app.** Any prerendering consumer has the same per-route head problem. `prerender.meta(route, output, bundle)` returns `{ title?, description? }`, and the tool rewrites the tags by attribute match, keeping the shell's tags and order.
- **One title function, shared by both sides.** The loom app exports a `topicTitle(title)` helper that the config hook and the client title effect both use, so the prerendered and navigated titles can't drift.
- **The description comes from the content when present.** The prerender entry exposes a topic's summary and falls back to `SITE_DESCRIPTION`.
- **The wordmark font is inlined.** The generator embeds the app's own font file as a data URI in the render page, so it doesn't depend on fonts installed on the machine.

## Risks

- A topic without a summary falls back to the generic description. That's acceptable, and the build logs which topics fell back.
- The text changes the image, so every crawler's cache holds the old card until it re-scrapes. LinkedIn's Post Inspector forces a re-scrape.

## Open Questions

- ~~Summary field~~: resolved. The topic's lead paragraph (`docsTopicText().lead`) is the summary; no Contentful change.
- ~~Wordmark placement~~: resolved. Right of the mark, matching the header lockup; "loom", as the header reads.
