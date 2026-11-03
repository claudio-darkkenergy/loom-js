## ADDED Requirements

### Requirement: Link-preview images name the project

`og-image.png` and `.github/social-preview.png` SHALL show the "loom" wordmark (as the header lockup reads) and the site tagline to the right of the mark, rendered from fonts the repo ships, so the image stays legible at feed-thumbnail size.

#### Scenario: Preview at thumbnail size

- **WHEN** the OG image is shown at 600 px wide
- **THEN** the wordmark is readable and the mark stays whole
