# Spec Delta

## ADDED Requirements

### Requirement: Sessions end with goodbye and frontends reconnect

On page hide the backend SHALL emit `goodbye`. A frontend that receives `goodbye`, or a message from a different session, SHALL drop stale state and retry `hello` until a backend answers.

#### Scenario: Frontend outlives its backend

- **WHEN** the backend a frontend talks to says `goodbye` and a new backend starts in the page
- **THEN** the frontend reconnects to the new session and shows the new tree without being reopened

## REMOVED Requirements

### Requirement: Reloads end a session and frontends reconnect

**Reason**: Its scenario described the popup window surviving a page reload; the popup is gone. The reconnect behavior continues as "Sessions end with goodbye and frontends reconnect".

**Migration**: None; the in-page HUD reloads with the page.
