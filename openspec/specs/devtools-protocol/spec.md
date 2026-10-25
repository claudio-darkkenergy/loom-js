# devtools-protocol Specification

## Purpose

Defines the versioned message protocol between the in-page devtools backend and any devtools frontend, so every frontend placement (and any future relay) speaks one contract.

## Requirements

### Requirement: Every message uses one tagged envelope

Every message SHALL be a JSON-serializable object carrying `source: 'loom-devtools'`, the protocol major version, the backend session id, a kind (`request`, `response` or `event`), a type, and an optional payload; requests and responses SHALL carry a correlation id, and failed responses an error code and message.

#### Scenario: Foreign messages are ignored

- **WHEN** a window receives a `message` event whose data lacks `source: 'loom-devtools'`
- **THEN** neither backend nor frontend acts on it

### Requirement: Messages are accepted only from the expected same-origin peer

Messages SHALL be posted with the page's own origin as target, and a receiver SHALL ignore any message whose origin differs from its own or whose source window is not its connected peer.

#### Scenario: Cross-origin frame is ignored

- **WHEN** a cross-origin iframe on the page posts a well-formed devtools request
- **THEN** the backend does not respond and performs no action

### Requirement: Sessions open with a version handshake

A frontend SHALL send `hello` with its protocol major before any other request. The backend SHALL answer with its session id and feature list, or fail with `protocol-mismatch` when majors differ; it SHALL reject other requests from a peer that has not completed `hello`.

#### Scenario: Version mismatch

- **WHEN** a frontend speaking protocol 2 says `hello` to a protocol 1 backend
- **THEN** the response fails with `protocol-mismatch` and the frontend shows the version conflict

### Requirement: Reloads end a session and frontends reconnect

On page hide the backend SHALL emit `goodbye`. A frontend that receives `goodbye`, or a message from a different session, SHALL drop stale state and retry `hello` until a backend answers.

#### Scenario: Popup survives a reload

- **WHEN** the inspected page reloads while the popup frontend is open
- **THEN** the popup reconnects to the new session and shows the new tree without being reopened

### Requirement: Ids are stable within a session

The backend SHALL identify instances and activities by numeric ids that stay the same for the object's lifetime within a session and are never reused. A request naming an unknown or retired id SHALL fail with `unknown-id`.

#### Scenario: Re-render keeps the id

- **WHEN** an instance re-renders with new props
- **THEN** it keeps its id and the frontend's selection stays on it

### Requirement: Values are encoded with bounded depth and expanded on demand

Inspected values SHALL be encoded as tagged descriptors covering primitives, functions, errors, arrays, plain and class objects, maps, sets, dates, DOM nodes, activities and component values, inlined two levels deep with collections capped at 100 entries. Deeper parts SHALL be fetched by path. Cycles and unserializable values SHALL encode as markers, never fail.

#### Scenario: Cyclic props

- **WHEN** an instance's props contain an object that references itself
- **THEN** inspection succeeds and the cycle appears as a `circular` marker

#### Scenario: Expanding a large array

- **WHEN** a prop holds a 5,000-item array and the user expands it
- **THEN** the first 100 items arrive inline and further items are fetched by path

### Requirement: Push traffic is opt-in and frame-batched

The backend SHALL emit `tree.changed`, `renders` and `activity.changed` events only for topics the frontend subscribed to, batched at most once per animation frame (or per short timer while the page's frames are paused) and coalesced per id. With no push topic subscribed, the backend SHALL leave core's devtools hook unset.

#### Scenario: Burst of updates

- **WHEN** an activity updates 50 times within one frame
- **THEN** the frontend receives one `activity.changed` for it carrying the last value

### Requirement: Activity edits go through the activity's own update path

`activity.update` SHALL apply the given JSON input through the activity's normal update (its transform included), and `activity.reset` through its reset. Input that is not valid JSON SHALL fail with `invalid-value`; an activity whose value cannot round-trip through JSON SHALL fail with `not-editable`.

#### Scenario: Editing a transformed activity

- **WHEN** the frontend sends `activity.update` with input `"loom"` to a search activity with an async transform
- **THEN** the transform runs with that input and the resulting commit is reported as `activity.changed`
