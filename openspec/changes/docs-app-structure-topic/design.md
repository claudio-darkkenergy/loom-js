# Design — docs-app-structure-topic

## Context

The wiring knowledge exists in fragments: Server Rendering's import-arrow comments, prerender-readiness's module-scope-DOM rule, the build entrypoints, skill-config's directory table (internal). `apps/loom` post-`server-first` will be the complete reference shape. Pink established the pattern for non-README topics: the outline artifact is the drift anchor.

## Goals / Non-Goals

**Goals:** one topic a beginner reads to know where every file goes and why; the import-arrow discipline (browser-only entry vs shared modules) stated as architecture, not example commentary; drift checkable against the reference app.

**Non-Goals:** prescribing one directory layout as the only valid one (conventions + rationale, not law); duplicating the build-tool topic (structure says _where_, build says _how it compiles_); framework code changes.

## Decisions

### D1 — Anatomy-first outline

Proposed shape (outline review refines): the three module roles (shared component tree / browser entry / server modules) and their import arrows; the shell and static assets; aliases and config homes; scope rules (DOM access, module-scope safety); a full annotated tree of the reference app. The Server Rendering topic keeps its wiring examples and gains a pointer here.

### D2 — Reference-app sourcing

Outline pointers cite `apps/loom` paths (post-server-first) the way core topics cite README headings — the drift check diffs the documented tree against the real one.

## Risks / Trade-offs

- [Best practices harden before the structure settles] → hard-sequenced after server-first + the build-package decision; gate task first.

## Migration Plan

Standard draft flow once gates open; publishes into the utility tail/group.

## Open Questions

- Standalone topic vs. co-authored with `build-tool` as one "project anatomy" pair — settled at outline review.
