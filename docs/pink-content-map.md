# Pink content map

The docs site is the canonical documentation for `@loom-js/pink`. This map is the drift anchor
(design D2 of `docs-pink-section`): per topic, the outline plus the source and stories the topic
describes. A change that alters consumer-visible behavior in a pointed-to file updates the topics
that list it, or records a docs follow-up — pink↔docs drift is never silent
(`docs-pink-coverage`).

Pink has no README equivalent to anchor on; `packages/pink/README.md` is an npm card (design D4) and
is not a documentation source. Storybook is the live catalog; topics link into it and do not
transcribe stories.

- **Site:** `https://loom-js-docs.vercel.app/docs/<slug>`
- **Storybook:** `https://loom-js-pink.vercel.app` (Vercel project `loom-js-pink`); a story's
  path is `?path=/story/<category>-<component>--<story>`, lower-cased from its `title`.
- **Topic sources:** `docs/topics/`, pushed to Contentful with `docs/contentful-sync/`
- **Paths** below are relative to `packages/pink/`. A component's story file sits beside it
  (`<dir>/<name>.stories.ts`) and is listed by its Storybook `title`.

## How to use it

1. A change touches a file under `src/` or `scss/`, or changes a story a topic leans on.
2. Find every topic whose pointers include that file.
3. The change's tasks update those topics (source, draft, publish), or record a follow-up.

The shared contract (`ComponentInputProps`, `is`, `attrs`, the modifiers) is documented once in
`pink-composition` and pointed to from there; a change to it is checked against every topic.

## Status

**Proposal — awaiting maintainer review (task 2.2).** Everything below the line is a partition
proposal; outlines are what the topics will contain, not what is published. Items marked
_decide_ need a verdict at review.

## Nav placement

Both sequencing gates have landed (`docs-feedback-topic` 2026-09-21, `docs-grouped-side-nav`
2026-09-26), so the section is a **sixth nav group, "Pink", after Reference**. The core learning
path stays intact and pagination crosses from `feedback` into `pink` as it crosses every other
group boundary.

This amends `docs-information-architecture`: trailing utility topics live in the final _core_
group (Reference), not the final group of the nav; flattening the groups yields the core map's
order followed by this map's order. The change carries that MODIFIED requirement.

_Decide:_ group last (recommended) vs. before Reference. Before Reference keeps the spec text
as is but splits the core path around a different package.

## Topics

| #   | Slug               | Title       |
| --- | ------------------ | ----------- |
| 1   | `pink`             | Pink        |
| 2   | `pink-composition` | Composing   |
| 3   | `pink-elements`    | Elements    |
| 4   | `pink-components`  | Components  |
| 5   | `pink-layout`      | Layout      |
| 6   | `pink-code-panels` | Code Panels |

Slugs carry the `pink-` prefix because `/docs/<slug>` is one flat namespace and `components`
already belongs to core; the overview takes the bare `pink`. Nav titles drop the prefix — the
group header supplies it.

Topic sources are `docs/topics/17-pink.md` … `22-pink-code-panels.md`: flat and numbered after
core's 16, so `push.py`'s glob and ordering need no change (D3: the tooling gains nothing).

_Decide:_ six topics (recommended — one per Storybook category plus the two concept topics), or
five with Layout folded into Components. Catalog topics follow Storybook's categories so every
h3 maps to one story group.

**Depth rule.** A catalog entry (h3) is: one or two sentences of purpose, the props that are
pink's (root form, modifiers, the `is-*` flags), one short sample, the story link. Full prop
tables only where the surface is large: `PinkButton`, `PinkCollapsible`, `PinkTable`,
`PinkCodePanel`. The reserved props every component accepts (`attrs`, `className`, `id`, `on`,
`onClick`, `style`, `children`) are documented once in `pink-composition`, never repeated.

### 1. `pink`

- **Outline:** What pink is · Origin · Install · Inclusion · Theming (h3 Theme classes · h3
  `usePinkTheming` · h3 CSS variables) · Storybook · Where next
- **Content:** the design system for loom apps — Pink Design 1.0, continued from the archived
  appwrite/pink (`NOTICE`: MIT, commit `bfc9ba1`), with loom components on top; install
  `@loom-js/pink` (peer `@loom-js/core`); the two stylesheet imports (`pink.css`, `icons.css`)
  plus the component import; the `theme-dark` / `theme-light` body class, `usePinkTheming`'s
  variable set, `--p-*` and `--color-*` variables as the theming surface; the cascade layers
  (so app CSS wins without specificity fights); pink is pre-1.0. Points into Storybook as the
  catalog and hands off to `pink-composition`.
- **Source:** `package.json` (`name`, `exports`, `peerDependencies`), `NOTICE`,
  `scss/_index.scss` (the layer order), `scss/1-css-variables/*` (the variable surface),
  `scss/abstract/variables/_common.scss` (`$theme-dark`), `src/hooks/use-pink-theming.ts`
  (`usePinkTheming`, `PinkThemeConfig`) with the fallbacks its knobs land on —
  `scss/6-elements/_avatar.scss` (`--avatar-bg-color`), `_card.scss` (`--card-bg-color`,
  `--card-border-radius`, `--card-padding`), `scss/2-resets/_typography.scss`
  (`--p-body-text-color`), `scss/1-css-variables/_colors.scss` (`--color-border`,
  `--color-primary-*`), `_fonts.scss` — and `src/types/index.ts` (`PinkColor`, `PinkSize`).
- **Also anchors:** `README.md` — the purpose/layering paragraph, install line and links stay
  consistent with this topic (D4: links alive, nothing more).
- **Reference consumer:** `apps/loom/src/app/bootstrap.ts` (the imports),
  `apps/loom/loom.config.ts` (`bodyClass: 'theme-dark'`), `apps/loom/src/app/app.ts`
  (`usePinkTheming` with fonts).

### 2. `pink-composition`

- **Outline:**
    - The props contract (h3 Reserved props · h3 `attrs` · h3 `style` as a list)
    - The polymorphic root (`is`)
    - Compound components
    - Modifiers (h3 `withIcon` · h3 `withTooltip` · h3 `withAnchorLink`)
    - Behaviors (h3 `PinkCopyToClipboard`)
    - Enums (`PinkColor`, `PinkSize`)
    - Markup and functional forms
- **Content:** every component takes core's `ComponentInputProps`; `attrs` is the passthrough
  for arbitrary attributes (never stray flat keys); `is` supplies the root as a component value
  (`el('footer')`); `PinkTable.Row`, `PinkCollapsible.Item`, `PinkDropList.List`,
  `PinkCodePanel.Content` are the compound pattern; modifiers are props-in/props-out
  transformers wrapped around any root; the copy behavior's `render` form (`copied.bind`,
  `copied.effect`); pink components are used with element syntax or called directly, same as
  core's. Samples use pink components by name (the inverted generic-components rule).
- **Source:** `src/types/index.ts` (`PinkDynamicProps`, `PinkColor`, `PinkSize`),
  `src/modifiers/with-icon.ts`, `with-tooltip.ts`, `with-anchor-link.ts`,
  `src/behaviors/pink-copy-to-clipboard/pink-copy-to-clipboard.ts` (`PinkCopyToClipboard`,
  `CopyState`, `CopyStateRender`), `src/elements/pink-tooltip/pink-tooltip-popup.ts`
  (`PinkTooltipPopup`, composed by both modifiers and the behavior).
- **Stories:** `Behaviors/PinkCopyToClipboard`; the modifiers have no stories of their own —
  `Elements/PinkButton` (icon placement), `Elements/PinkTooltip` (tooltip placement) and
  `Elements/PinkCopyButton` show them.

### 3. `pink-elements`

- **Outline:** one h3 per element, Storybook order: `PinkBox` · `PinkBoxes` · `PinkButton` ·
  `PinkButtonsList` · `PinkCard` · `PinkCopyButton` · `PinkInlineCode` · `PinkInlineTag` ·
  `PinkInteractiveTag` · `PinkLoader` · `PinkStatus` · `PinkTag` · `PinkTooltip`
- **Full prop table:** `PinkButton` (root form by `href`, size/padding/font variables, the
  `is-*` flags, root-only props).
- **Notes worth carrying:** `PinkCard`/`PinkTag` take `is`; `PinkTag.Tag` exposes the
  polymorphic base; `PinkInteractiveTag` picks `<a>`/`<button>` by `href`; `PinkLoader` owns its
  class (no caller `className`); `PinkInlineCode` is functional on purpose (`pre-wrap`);
  `PinkStatus` renders `status` as text unless `text` is given; `PinkTooltip` is always a
  `<button>`.
- **Source:** `src/elements/*/` (one module per element; `pink-tooltip/` also holds the popup,
  documented in `pink-composition`), `src/elements/pink-status/pink-status.ts`
  (`PinkStatusState`).
- **Stories:** `Elements/PinkBox`, `Elements/PinkBoxes`, `Elements/PinkButton`,
  `Elements/PinkButtonsList`, `Elements/PinkCard`, `Elements/PinkCopyButton`,
  `Elements/PinkInlineCode`, `Elements/PinkInlineTag`, `Elements/PinkInteractiveTag`,
  `Elements/PinkLoader`, `Elements/PinkStatus`, `Elements/PinkTag`, `Elements/PinkTooltip`.
- **Styles:** `scss/6-elements/*` (the classes the components emit).

### 4. `pink-components`

- **Outline:** one h3 per component: `PinkActionBar` · `PinkAvatar` · `PinkAvatarGroup` ·
  `PinkCollapsible` · `PinkDropList` · `PinkGridItem` · `PinkTable` · `PinkTabs` ·
  `PinkToggleButton`
- **Full prop tables:** `PinkCollapsible` (single-item form vs. `List`/`Item`; `isDisabled`
  renders `<div>`s; `isOpen`), `PinkTable` (root flags; `Head`/`Body`/`Foot`/`Row`/`HeadCol`/
  `Col`/`Wrapper`; `is` for list tables and interactive rows).
- **Notes worth carrying:** `PinkAvatar` branches `<img>`/`<div>` on `alt`; `PinkDropList`'s
  `itemProps` vs. `children`, `DropListArrow`, and the `List`/`Item`/`Section` parts (the side
  nav composes them); `PinkTabs` is link tabs with scroll controls — not the code panel's tab
  strip; `PinkToggleButton`'s `buttonProps` carry `isSelected`.
- **Source:** `src/components/*/` except `pink-code-panel/` (owned by `pink-code-panels`).
- **Stories:** `Components/PinkActionBar`, `Components/PinkAvatar`, `Components/PinkAvatarGroup`,
  `Components/PinkCollapsible`, `Components/PinkDropList`, `Components/PinkGridItem`,
  `Components/PinkTable`, `Components/PinkTabs`, `Components/PinkToggleButton`.
- **Styles:** `scss/7-components/*` for the components above; `scss/6-elements/_table.scss`,
  `_avatar.scss`.

### 5. `pink-layout`

- **Outline:** `PinkContainer` · `PinkGridBox` · `PinkGridHeader` · `PinkSideNav` ·
  `PinkTopNav` · Putting a page together
- **Notes worth carrying:** `PinkGridBox` maps `cols`/gap/item-size props to grid variables and
  omits `style` when empty; `PinkGridHeader` is slot-driven (`col1`–`col4`) with callers placing
  the grid classes; `PinkSideNav`'s `top` (arbitrary sections, the docs nav's grouped
  collapsibles) vs. `topLinkProps` (one flat list), `bottom`; `PinkTopNav`'s nav-level
  `onClick`/`on` as item fallbacks. The closing section composes the docs app's shell: top nav,
  side nav, container.
- **Source:** `src/layout/*/`.
- **Stories:** `Layout/PinkContainer`, `Layout/PinkGridBox`, `Layout/PinkGridHeader`,
  `Layout/PinkSideNav`, `Layout/PinkTopNav`.
- **Styles:** `scss/8-grids/_grid-box.scss`, `_grid-header.scss`, `scss/7-components/_side-nav.scss`,
  `scss/6-elements/_container.scss`.
- **Reference consumer:** `apps/loom/src/app/components/` (the docs shell and `DocsSideNav`).

### 6. `pink-code-panels`

- **Outline:**
    - The panel and its parts (h3 `Header` · h3 `Content` · h3 `CopyButton` · h3 `Tabs`)
    - Highlighting (h3 The `tokenize` contract · h3 `@loom-js/highlight`)
    - Tabbed variants (h3 `resolveCodePanelTab` · h3 Shared selections)
    - Theming (`--p-code-token-*`)
    - Example
- **Content:** `PinkCodePanel` + `Header`/`Content`/`CopyButton`/`Tabs`; `Content` renders
  plain lines until a tokenizer lands, then re-renders tokenized — pink carries no highlighter,
  the app hands in a lazy-import activity (`codeTokenizer()` from `@loom-js/highlight` is the
  shipped one; the story's stub shows the contract); line numbers; copy with a getter for the
  active variant; the tab strip driven by a `CodePanelTabSelection` activity, shared across
  panels for synced groups; the token kinds and the `--p-code-token-<kind>` variables (light base,
  `.theme-dark` preset) as the re-theme surface. The example is the docs app's `CodeSample` /
  `TabbedCodeSample` shape.
- **Source:** `src/components/pink-code-panel/pink-code-panel.ts`, `pink-code-panel-content.ts`
  (`PinkCodePanelContent`, `TokenizeActivity`), `pink-code-panel-header.ts`,
  `pink-code-panel-copy-button.ts`, `pink-code-panel-tabs.ts` (`PinkCodePanelTabs`,
  `CodePanelTabSelection`, `resolveCodePanelTab`), `lib/token-lines.ts` (`CodeToken`,
  `Tokenize`, `splitTokenLines`); `scss/7-components/_code-panel.scss`, `_code-tokens.scss`;
  `packages/highlight/src/tokenize.ts` (`CodeTokenKind`, the language aliases) for the
  highlight section.
- **Stories:** `Components/PinkCodePanel`.
- **Reference consumer:** `apps/loom/src/app/components/content/styled-rich-text/lib/code.ts`,
  `apps/loom/src/app/logic/activity/code-tab-group.ts`.
- **Cross-links:** `/docs/lazy-imports` (the activity shape), the core content map's "Code
  block directives" (how topics author tabbed samples).

## Carried conventions

From the core map and `align-loom-docs-with-core-readme`, unchanged unless listed:

- Topic files: front matter `slug`/`title`; an unheaded lead paragraph; body headings from h2;
  h2/h3 anchors are the kebab-cased heading text (semi-permanent — renames are redirect notes).
- Code samples: 4-space in source, re-indented to 2 at push; fence info `ts`/`bash`/`html`
  becomes the `// @lang` directive; install blocks use `tab=npm|yarn|pnpm group=pm`; template
  samples always show the `component((html) => …)` wrapper; backticks inside template literals
  are escaped; selected samples close with one line of transitional copy.
- **Inverted rule:** pink topics use pink components by name (`PinkButton`, not `Button`) — the
  core topics' generic-components rule does not apply here.
- Storybook links are plain external links (`target` default); a topic links the component's
  story group, not individual stories, unless one story is the point.
- Cross-links into core topics are `/docs/<slug>` SPA links as everywhere else.
- `llms.txt` / `llms-full.txt` pick the topics up from the listing with no extra work.

## Export coverage

Every export of `src/index.ts` has a topic above or is excluded here. Types ride with their
value.

| Export                                                                                                                                                                                                                                                                                                                                | Topic              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `usePinkTheming`, `PinkThemeConfig`                                                                                                                                                                                                                                                                                                   | `pink`             |
| `PinkColor`, `PinkSize`, `PinkDynamicProps`, `withIcon`, `withTooltip`, `withAnchorLink`, `PinkCopyToClipboard`, `CopyState`, `CopyStateRender`, `PinkTooltipPopup`                                                                                                                                                                   | `pink-composition` |
| `PinkBox`, `PinkBoxes`, `PinkButton`, `PinkButtonsList`, `PinkCard`, `PinkCopyButton`, `PinkInlineCode`, `PinkInlineTag`, `PinkInteractiveTag`, `PinkLoader`, `PinkStatus`, `PinkStatusState`, `PinkTag`, `PinkTooltip`                                                                                                               | `pink-elements`    |
| `PinkActionBar`, `PinkAvatar`, `PinkAvatarGroup`, `PinkCollapsible`, `PinkDropList`, `DropListArrow`, `DropListItemProps`, `PinkGridItem`, `PinkTable` (+ `PinkTableCol`, `PinkTableHeadCol`, `PinkTableRow`, `PinkTableHead`, `PinkTableBody`, `PinkTableFoot`, `PinkTableWrapper`), `PinkTabs`, `LinkItemProps`, `PinkToggleButton` | `pink-components`  |
| `PinkContainer`, `PinkGridBox`, `PinkGridHeader`, `PinkSideNav`, `PinkTopNav`, `PinkTopNavItemProps`                                                                                                                                                                                                                                  | `pink-layout`      |
| `PinkCodePanel` (+ `Header`, `Content`, `CopyButton`, `Tabs`), `PinkCodePanelContentProps`, `Tokenize`, `CodeToken`, `TokenizeActivity`, `CodePanelTabSelection`, `PinkCodePanelTabsProps`, `resolveCodePanelTab`                                                                                                                     | `pink-code-panels` |

The `PinkTable*` sub-components are also exported flat; the topic documents them as
`PinkTable.<Part>` and mentions the flat names once.

## Gaps surfaced while mapping

Every gap the mapping surfaced was fixed inside this change (2026-10-04), so the topics describe a
surface that works as declared:

- The code panel's highlighting contract (`Tokenize`, `CodeToken`, `TokenizeActivity`,
  `PinkCodePanelContentProps`) is exported.
- The `PinkActionBar` story sits under `Components/`; the code-panel story's comment names
  `codeTokenizer()`.
- `usePinkTheming` applies every knob: `avatarBgColor` (new `--avatar-bg-color` fallback, both
  themes), `cardBgColor` under `.theme-dark`, `textColor` (`--p-body-text-color` + the root's
  `color`); a `cardPaddingMobile` knob covers the card's breakpoint padding
  (`--card-padding-mobile`).
