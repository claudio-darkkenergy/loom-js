---
'@loom-js/core': minor
---

Async transform dispatches are now deterministic — **behavior change**: overlapping `update()` calls used to race, committing whichever run's inner `update` landed last in real time (stale data could overwrite newer). The default is now latest-dispatch-wins: a newer `update()` retires an in-flight run — its new `AbortSignal` (`signal` on the transform context) aborts and its late commits are dropped — extending the sync path's last-call-wins guarantee to async. Code that relied on the old interleaving was relying on nondeterminism; the deliberate replacements are the new `concurrency` option's opt-in modes: `'ordered'` (parallel runs, commits applied strictly in dispatch order) and `'serial'` (each run starts after its predecessor settles and sees its committed `value`). Also new: a per-run `timeout` option that retires hung runs (signal aborted, queue released, settlement unpinned), and the transform's `input` is now typed `Readonly<I>`.
