---
'@loom-js/pink': patch
---

`usePinkTheming` now applies every knob it declares: `avatarBgColor` reaches the avatar in both themes (the stylesheet reads a new `--avatar-bg-color` fallback), `cardBgColor` also applies under `.theme-dark`, and `textColor` sets the page text color for the app root's subtree. New `cardPaddingMobile` knob: the padding the card uses at pink's first breakpoint and below (`--card-padding-mobile`).
