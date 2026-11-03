## ADDED Requirements

### Requirement: Prerendered routes can set head metadata

When `prerender.meta` is configured, the tool SHALL call it for each prerendered route with the route, its output and the bundle. When it returns a `title` or `description`, the tool SHALL write the `title` into that route's `<title>` and `og:title`, and the `description` into its `<meta name="description">` and `og:description`, escaping each value for HTML. A shell without a description tag SHALL get one; Open Graph tags SHALL be rewritten only where the shell has them. Fields it leaves out SHALL keep the shell's values.

#### Scenario: Per-route title

- **WHEN** `prerender.meta` returns `{ title: 'Routing | Site' }` for `/docs/routing`
- **THEN** that route's `index.html` carries `<title>Routing | Site</title>` and a matching `og:title`, and other routes keep the shell title

#### Scenario: No hook

- **WHEN** `prerender.meta` is not configured
- **THEN** every route keeps its shell's head unchanged
