# Spec Delta

## Purpose

Defines `@loom-js/devtools`, the inspector app authors use: a HUD docked in the page or popped out to a window, element picking and highlighting, live activity editing, and the console and performance-panel integrations.

## ADDED Requirements

### Requirement: The HUD runs isolated from the inspected app

The HUD SHALL render in its own document — a docked frame in the page or a popup window — so that it never appears in the app's component tree, never receives the app's styles, and never applies styles to the app.

#### Scenario: Tree excludes the HUD

- **WHEN** the dock is open and the tree is read
- **THEN** no HUD component appears in it

#### Scenario: Style isolation

- **WHEN** the app defines a global `button { color: red }`
- **THEN** HUD buttons are unaffected, and app buttons are unaffected by the HUD's styles

### Requirement: The HUD can dock or pop out

`loom.devtools.open('dock')` SHALL show the HUD docked at a page edge; `open('popup')` and the dock's pop-out control SHALL move it to a separate window, closing the dock. If the browser blocks the popup, or the window it gets back belongs to another origin, the HUD SHALL stay docked, SHALL never write into that window, and the console SHALL say why.

#### Scenario: Popup blocked

- **WHEN** `loom.devtools.open('popup')` runs without user activation and the browser blocks it
- **THEN** the dock opens and a console message points to the dock's pop-out control

#### Scenario: Foreign window holds the popup name

- **WHEN** a window from another origin already holds the popup's name and `open('popup')` runs
- **THEN** nothing is written into that window, the dock opens, and the console says another origin holds the name

### Requirement: The tree view tracks the live app

The HUD SHALL show the component tree with names, keys and activity boundaries, update it when the app's structure changes, and keep the selection on the same instance across re-renders.

#### Scenario: Route change

- **WHEN** the app navigates to another route
- **THEN** the tree shows the new route's components without a manual refresh

### Requirement: Selecting an instance shows its props and activities

Selecting a tree node SHALL show the instance's props as last rendered (expandable), its activities with current values and pending state, and its life-cycle state; props SHALL be read-only.

#### Scenario: Inspect props

- **WHEN** the user selects a `Card` rendered with `{ title: 'Hi', tags: ['a'] }`
- **THEN** the inspector shows `title` and an expandable `tags` array

### Requirement: Picking and highlighting map between page and tree

Hovering a tree node SHALL outline its rendered output in the page; picker mode SHALL outline the component under the pointer and select it on click without the click reaching the app.

#### Scenario: Pick an element

- **WHEN** the user enables the picker and clicks a button inside `Toolbar`
- **THEN** `Toolbar`'s instance is selected in the HUD and the app's click handler does not run

### Requirement: Activities are editable from the HUD

The HUD SHALL list activities with their names and values, allow editing JSON-representable values and resetting, and show non-editable values read-only.

#### Scenario: Edit an activity

- **WHEN** the user changes a boolean toggle activity's value from `false` to `true`
- **THEN** the app re-renders as if the app had called `update(true)`

### Requirement: Renders can be visualized

When render highlighting is on, each instance that renders SHALL briefly flash its outline in the page, and the HUD SHALL show per-instance render counts since the session started.

#### Scenario: Flash on update

- **WHEN** render highlighting is on and an activity update re-renders two instances
- **THEN** both instances' outlines flash once and their counts increase by one

### Requirement: Live objects can be sent to the page console

The HUD's log action SHALL log the selected instance's or activity's live object to the inspected page's console and expose it as `$loom` there.

#### Scenario: Log to console

- **WHEN** the user clicks log on a selected activity
- **THEN** the page console shows the activity, and `$loom.update(…)` in the console updates it

### Requirement: Console output is formatted when custom formatters are on

While devtools is running, objects returned by the `loom` console API and logged loom objects SHALL render with loom-specific headers (name, key, value preview) in consoles with custom formatters enabled, and SHALL render as plain objects otherwise.

#### Scenario: Formatted inspect

- **WHEN** custom formatters are enabled in the browser and `loom.inspect($0)` is logged
- **THEN** the console line reads as the component's name and key, expandable to props and activities

### Requirement: Renders appear in the browser's performance timeline

With the performance option on, each instance render and activity commit SHALL be recorded as a timed entry on a loom track in the browser's Performance panel, labeled with the instance or activity name.

#### Scenario: Profile a slow update

- **WHEN** the user records a performance profile with the option on and triggers an update
- **THEN** a loom track shows a named entry per rendered instance with its duration
