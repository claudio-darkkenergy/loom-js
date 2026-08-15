# content-delivery-performance Specification

## Purpose

Defines the performance contract of the Contentful content path in `@loom-js/loom` and `services/api`: production reads hit the cached Delivery API (preview is an explicit opt-in), the `/api/contentful/graphql` proxy's non-preview responses are CDN-cacheable while preview and error responses never are, CORS preflights are cached (and content GETs avoid them entirely), a page navigation costs a single batched GraphQL request, already-fetched content renders without a skeleton flash, and GraphQL errors surface as a rendered error state instead of an indefinite skeleton.

Established by the `web-vitals-contentful-latency` change (2026-08-14), which measured the prior path at ~1.9 s to content on localhost (2 uncached preflights + 2 Preview-API POSTs) and replaced it with one preflight-free, edge-cacheable GET.

## Requirements

### Requirement: Preview mode is an explicit opt-in

Content requests SHALL query Contentful's Delivery API by default; the Preview API SHALL be used only when `CTF_IS_PREVIEW` is explicitly set to `'true'` at build time. No code path may fall back to preview when the flag is unset.

#### Scenario: Unset flag builds a delivery-mode app

- **WHEN** the app is built with no `CTF_IS_PREVIEW` in the environment
- **THEN** every GraphQL document sent by the client carries `isPreview: false` (or omits preview), and responses come from the Delivery API

#### Scenario: Preview requires explicit opt-in

- **WHEN** the app is built with `CTF_IS_PREVIEW=true`
- **THEN** content requests use the Preview API and preview responses are never cached by the proxy

### Requirement: Content proxy responses are edge-cacheable

The `/api/contentful/graphql` proxy SHALL mark non-preview content responses as cacheable by the CDN (`s-maxage` with `stale-while-revalidate`) so repeat reads of the same content are served from the edge without an origin→Contentful round trip. Preview responses SHALL NOT be cacheable.

#### Scenario: Repeat content read is served from cache

- **WHEN** two identical non-preview content requests arrive within the cache window
- **THEN** the second is served from the CDN cache without contacting Contentful

#### Scenario: Preview responses bypass the cache

- **WHEN** a preview-mode content request is handled
- **THEN** the response carries no CDN cache directive and is fetched fresh from Contentful

### Requirement: CORS preflights are cached

The API's OPTIONS handling SHALL include `Access-Control-Max-Age` so a browser does not re-issue a preflight for every content request within the max-age window.

#### Scenario: Second content request skips the preflight

- **WHEN** the client issues two content POSTs within the max-age window from the same page
- **THEN** only the first is preceded by an OPTIONS preflight

### Requirement: Docs navigation issues a single content request

A docs-route navigation SHALL fetch the side-nav page listing and the topic body in one GraphQL document rather than separate requests.

#### Scenario: One POST per docs navigation

- **WHEN** the user navigates to `/docs/<topic>` with an empty cache
- **THEN** exactly one request to `/api/contentful/graphql` is issued, and both the side nav and the topic body render from its response

### Requirement: Cached content renders without a skeleton flash

Navigating to content whose response is already in the client request cache SHALL render that content directly. The skeleton SHALL appear only while no data exists for the target content.

#### Scenario: Revisiting a topic

- **WHEN** the user navigates to a docs topic they have already viewed this session
- **THEN** the topic content renders without an intermediate skeleton state

#### Scenario: First visit still shows the skeleton

- **WHEN** the user navigates to a topic not yet fetched
- **THEN** the skeleton renders until the response lands

### Requirement: GraphQL errors surface to the app

The proxy SHALL pass through the GraphQL response envelope including `errors`; the app SHALL treat an errored response as a failed load and render an error state rather than an indefinite skeleton.

#### Scenario: Upstream GraphQL error

- **WHEN** Contentful returns HTTP 200 with an `errors` array and no usable data
- **THEN** the docs page renders an error state, and the failed result is not cached by the client request cache
