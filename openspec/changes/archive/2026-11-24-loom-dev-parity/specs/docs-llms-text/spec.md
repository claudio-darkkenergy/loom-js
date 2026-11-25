## MODIFIED Requirements

### Requirement: The files are build output

Neither file SHALL be authored or committed. Both SHALL be regenerated on every production build, and `loom dev` SHALL serve both from the same generation step.

#### Scenario: a topic is published

- **WHEN** a topic changes in Contentful and the site rebuilds
- **THEN** both files reflect the change with no other edit

#### Scenario: served in dev

- **WHEN** `pnpm dev` is running with Contentful credentials and `/llms.txt` is requested
- **THEN** the generated topic index is served as text, not the HTML shell
