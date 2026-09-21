---
slug: feedback
title: Feedback
---
loom is pre-1.0 and shaped by use. If something surprised you — a bug, an API that fought you, a doc that didn't answer the question you actually had — say so. The maintainer reads everything.

## Found a bug?

Open an issue on [GitHub Issues](https://github.com/claudio-darkkenergy/loom-js/issues). The most useful reports carry three things:

- the `@loom-js/core` version (or the package involved),
- a minimal template or component that reproduces it,
- what you expected against what rendered — a snippet of the resulting DOM beats a description of it.

Diagnostics can do some of the work for you: switch on narration with `loom.setDebug(true)` in the console and include the relevant `[loom]` lines — see [Diagnostics](/docs/diagnostics).

## Questions and ideas

For anything that isn't a defect — how-do-I questions, API design reactions, "is this the intended pattern?" — start a thread on [GitHub Discussions](https://github.com/claudio-darkkenergy/loom-js/discussions). And if the docs should have answered your question but didn't, that's a docs bug — mention where you looked for it.

## What helps most right now

Pre-1.0 is when API-surface feedback is cheapest to act on. The most valuable things to hear at this stage:

- **Friction in the authoring surface** — places where element syntax, activities, or the built-in props made you reach for a workaround.
- **Missing primitives** — something you had to build around the framework rather than with it.
- **The docs' blind spots** — the question you had that this site didn't answer, and where you looked for it.

None of it needs to be polished. A rough issue today beats a complete one after 1.0 locks the surface in.
