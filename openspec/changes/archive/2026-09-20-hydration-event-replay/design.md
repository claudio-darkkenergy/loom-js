# Design — hydration-event-replay

## Context

`hydrate` renders detached, gates on `settled()` (+ `ready`), then `mount` performs one `replaceChildren` swap; `_lifeCycles.observe` fires `onMounted` after attachment. The served markup receives no listeners by design (pre-swap inertness). Trees match structurally because both sides run the same render path — the property this design leans on.

## Goals / Non-Goals

**Goals:** early interactions on framework-handled UI are honored, not lost; opt-in with literal-zero cost when off; native anchor degradation preserved; deterministic ordering.

**Non-Goals:** partial/selective hydration (the atomic swap stays); replaying high-frequency events (mousemove/scroll — pointless to queue); synthesizing focus/IME state (input _values_ carry over only insofar as the swap preserves user-typed state — out of scope here, noted as a docs caveat); any always-on default.

## Decisions

### D1 — Opt-in surface: `replayEvents?: boolean | string[]`

`true` = `['click', 'submit']` — the interactions users actually lose. An array opts into others (e.g. `change`). Off by default: replay dispatches synthetic re-fires, which is observable behavior an app must expect, so it is chosen, never ambient.

### D2 — Structural index paths, resolved at dispatch

Record each event target as the child-index trail from the served root; resolve the same trail against the client tree at replay time. Same render path ⇒ same structure, so no ids, no attributes, no fuzziness. Resolution failure (divergence, expired settle with pending regions) drops the event with a warning naming the path — a dropped click must be diagnosable, never mis-delivered.

### D3 — Capture semantics

One capturing listener per type on the root (not document — scoped to the hydrating app). `submit` is always `preventDefault`ed when recorded (a full-page form post mid-boot is the exact loss being solved); `click` is `preventDefault`ed only when the target has no enclosing `href`-bearing anchor — anchors keep native navigation even with replay on (the graceful-degradation guarantee outranks replay).

### D4 — Replay timing & ordering

FIFO re-dispatch after the swap **and** after the lifecycle sweep (`onMounted` fired), before `onAppMounted` — handlers run against a mounted, observed tree, and the app-mounted callback sees post-replay state. Re-dispatch uses real constructed events (`new MouseEvent('click', …)`/`new SubmitEvent(…)`) so existing handlers need no changes; the queue is capped (drop-oldest with a warning) as a runaway-click guard.

## Risks / Trade-offs

- [Replayed events surprise analytics/dedupe logic] → opt-in + docs caveat; replayed events are dispatched untrusted (`isTrusted: false`), which is also the honest signal.
- [maxWait-expiry swap diverges from served DOM] → D2 drops unresolvable paths loudly; never guess.
- [Bundle weight] → replay lives in the hydrate graph; `init`-only apps tree-shake it (existing "non-hydrating apps pay nothing" requirement extends to cover it).

## Migration Plan

Minor release; default-off means zero behavior change for existing apps.

## Open Questions

None — the default event set is revisitable at red-spec review if `change` proves commonly needed.
