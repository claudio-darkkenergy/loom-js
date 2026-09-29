# docs-llms-text Specification

## Purpose

Defines the plain-text documentation served for AI agents: the docs site's generated topic index (`/llms.txt`) and full-text file (`/llms-full.txt`), and the full-text file the `@loom-js/core` package ships for its own version. All are build output, never authored.

Established by the `docs-llms-text` change (2026-09-29).

## Requirements

### Requirement: The site serves a generated topic index

The production build SHALL emit `/llms.txt` listing every docs topic in side-nav order, grouped as the side-nav groups them, each with its title, absolute URL and a one-line description taken from the topic's lead paragraph. Trailing utility topics SHALL be omitted.

#### Scenario: every listed topic appears once

- **WHEN** the build completes
- **THEN** `/llms.txt` holds one entry per concept topic in the docs listing, in listing order, and each URL resolves to that topic's prerendered page

#### Scenario: a topic has no lead

- **WHEN** a listed topic has no lead paragraph to describe it
- **THEN** the build fails and names the topic

### Requirement: The site serves the full docs as one markdown file

The production build SHALL emit `/llms-full.txt` holding every concept topic as markdown, concatenated in side-nav order, generated from the same Contentful data the prerendered pages render. Code samples SHALL be fenced with their language, and links SHALL be absolute.

#### Scenario: content matches the site

- **WHEN** a topic's text in `/llms-full.txt` is compared with its prerendered page
- **THEN** the headings, prose and code samples are the same

#### Scenario: an unknown block type

- **WHEN** a topic contains a rich-text node the serializer does not handle
- **THEN** the build fails and names the topic and node type

#### Scenario: links work out of context

- **WHEN** a topic links to another topic or anchor
- **THEN** the link in the file is an absolute URL on the docs site

### Requirement: The files are build output

Neither file SHALL be authored or committed; both SHALL be regenerated on every production build.

#### Scenario: a topic is published

- **WHEN** a topic changes in Contentful and the site rebuilds
- **THEN** both files reflect the change with no other edit

### Requirement: The core package ships its own full docs

The published `@loom-js/core` package SHALL include `llms-full.txt`, generated at package build time from the topic sources in the repository at that version, without network access.

#### Scenario: an installed package

- **WHEN** `@loom-js/core` is installed
- **THEN** `node_modules/@loom-js/core/llms-full.txt` exists and documents the installed version's API

#### Scenario: building offline

- **WHEN** `build-package` runs with no network and no Contentful credentials
- **THEN** the file is generated
