# Design — docs-llms-text

## Context

The prerender phase (`apps/loom/project/client/prerender.mts`) lists the docs topics from Contentful and renders each to HTML. Topic bodies are Contentful rich text. The authored markdown for every topic lives in the repo (`docs/topics/*.md`) and is converted and pushed to Contentful; a draft is compared to its source before it is published.

## Goals / Non-Goals

**Goals:** one fetch gives an agent the whole manual; the files are build output; the packaged copy matches the package version; a broken or partial file fails the build.

**Non-Goals:** a hand-written summary page; per-topic `.md` URLs; API reference generated from types (that is `api-reference-docs`); pink topics (they join when `docs-pink-section` lands, through the same listing); any runtime code in core.

## Decisions

### D1 — Site files come from Contentful, at prerender time

The prerender already holds the listing and fetches each topic, so the files describe exactly what the site shows, in the same order, including anything edited in Contentful. Generating them from the repo sources instead would let the site and the file disagree whenever a draft is unpublished.

### D2 — Rich text → markdown is a serializer in `@loom-js/contentful`

A pure function, document in, string out, next to the existing renderer. It follows the content map's rich-text conventions in reverse: a sole-code paragraph becomes a fenced block, its `// @lang` directive becomes the fence language and is dropped from the body; a quote block becomes a blockquote; tables become pipe tables; h2/h3 stay h2/h3 under an h1 of the topic title. An unknown node type throws, so a new block type cannot silently vanish from the output.

_Alternative:_ convert the prerendered HTML to markdown. Rejected: it would pick up navigation, TOC and code-panel chrome, and needs an HTML-to-markdown dependency.

### D3 — Links are absolute

`/docs/<slug>` links and anchors are rewritten to `https://<site origin>/docs/<slug>`, from one configured origin. The files are read out of context, where a relative link means nothing.

### D4 — The one-line description is the topic's lead

Every topic opens with an unheaded lead paragraph; its first sentence is the description in `llms.txt`. No new Contentful field, nothing extra to keep in step. A topic with no lead fails the build.

### D5 — The packaged file comes from the repo sources

`build-package` concatenates `docs/topics/*.md` in listing order, with the same link rewriting. The package must describe the version it ships with, and the site describes HEAD, so the package cannot take the site's file. It also keeps publishing free of Contentful credentials and network. The file is generated into the package root, git-ignored, and listed in `files`.

_Alternative:_ commit the generated file. Rejected: a second copy to keep current by hand.

### D6 — `llms.txt` follows the llmstxt.org shape

An h1 with the name, a blockquote pitch, then one h2 per side-nav group with a link list. Trailing utility topics (`feedback`) are left out of both files; they hold no API content.

### D7 — The topic sources move to `docs/`

D5 makes the topic sources build input, and they are the source for every Contentful push. They lived inside an archived change, which reads as a finished record. They move to `docs/topics/`, the sync tooling to `docs/contentful-sync/`, and the content map to `docs/content-map.md`. The earlier map in the `align-loom-docs-with-core-readme` archive stays there as the record of the rich-text conventions and redirects.

## Risks / Trade-offs

- [Site file and packaged file differ in formatting, since one comes from rich text and one from markdown] → a test serializes each repo source through `md2rich`-equivalent fixtures and compares text content, not bytes.
- [Few crawlers request `llms.txt` unprompted] → the README and the docs home link to it; the value is an address to hand an agent.
- [File size grows with the docs] → about 15 topics today; the build logs both sizes, no cap.

## Migration Plan

Additive. Ship the serializer and site files first, the packaged file with the next core release. Rollback is `git revert`.

## Open Questions

None.
