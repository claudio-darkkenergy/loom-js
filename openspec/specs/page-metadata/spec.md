# page-metadata Specification

## Purpose

How the docs app's pages identify themselves to search engines, link previews and the browser tab: a title and description for each route, kept in sync as the reader navigates.

## Requirements

### Requirement: Docs topics carry their own title

Each prerendered docs topic SHALL set `<title>` and `og:title` to "<Topic title> | Loomjs docs". The home and benchmarks routes SHALL keep titles that name the page and the project.

#### Scenario: Topic title in a shared link

- **WHEN** `/docs/getting-started` is fetched without running scripts
- **THEN** its `<title>` and `og:title` both read "Getting Started | Loomjs docs"

### Requirement: Routes carry a description

Every prerendered route SHALL carry `<meta name="description">` and `og:description`. A topic SHALL use its own summary when the content provides one, and the site description otherwise.

#### Scenario: Topic without a summary

- **WHEN** a topic has no summary in its content
- **THEN** both description tags carry the site description

### Requirement: The title follows client-side navigation

After hydration, `document.title` SHALL match the title the prerender would give the current route, updated on every route change.

#### Scenario: Navigating between topics

- **WHEN** the reader moves from one docs topic to another through an in-app link
- **THEN** the tab title changes to the new topic's title without a reload
