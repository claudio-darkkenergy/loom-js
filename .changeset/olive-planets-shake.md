---
'@loom-js/pink': minor
---

Side-nav grouping support: `PinkSideNav` accepts a `top` value for arbitrary main-area content (takes precedence over the flat `topLinkProps` list); new `PinkCollapsible` — the upstream Collapsible ported to completion over the shipped `.collapsible` classes, as a single-item convenience form plus `List` and `Item` compound parts (`Item` owns the native `<details>`/`<summary>` disclosure — `buttonProps` render its header with an optional trailing label, `contentProps` style its content region, and `isDisabled` renders non-interactive `<div>`s); `PinkDropList.Item` is exported for mixed-content drop lists. A `styles/side-nav.css` stylesheet aligns collapsible group headers inside `.side-nav` with the drop buttons' inline padding.
