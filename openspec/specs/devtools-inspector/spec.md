# devtools-inspector Specification

## Purpose

Defines `@loom-js/devtools`, the inspector app authors use: a HUD docked in the page or popped out to a window, element picking and highlighting, live activity editing, and the console and performance-panel integrations.

## Requirements

### Requirement: The HUD runs isolated from the inspected app

The HUD SHALL render in its own document — a frame in the page, docked or floating — so that it never appears in the app's component tree, never receives the app's styles, and never applies styles to the app.

#### Scenario: Tree excludes the HUD

- **WHEN** the dock is open and the tree is read
- **THEN** no HUD component appears in it

#### Scenario: Style isolation

- **WHEN** the app defines a global `button { color: red }`
- **THEN** HUD buttons are unaffected, and app buttons are unaffected by the HUD's styles

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

Hovering a tree node, an ancestor in the selected instance's path, or a prop that holds a component SHALL outline the instance in the page, and clicking one SHALL select it; a prop holding a component (`children`, a named slot, an `el()` element) SHALL link to the instance it rendered while that instance is live. Picker mode SHALL outline the component under the pointer and select it on click without the click reaching the app. A picked instance's tree row SHALL be revealed: its collapsed ancestors expanded and the row scrolled to the middle of the tree pane, without scrolling the inspected page. Scrolling the page to the selected instance SHALL be offered only while the instance is not in view, and SHALL scroll the page only when the instance is out of view.

#### Scenario: Pick an element

- **WHEN** the user enables the picker and clicks a button inside `Toolbar`
- **THEN** `Toolbar`'s instance is selected in the HUD and the app's click handler does not run

#### Scenario: Pick reveals a deep row

- **WHEN** the user picks an instance whose tree row sits under a collapsed ancestor, below the tree pane's visible area
- **THEN** the ancestors expand and the selected row is scrolled to the middle of the tree pane

#### Scenario: Scroll to an instance already in view

- **WHEN** the selected instance is wholly visible, for example a link in a sticky table of contents
- **THEN** the HUD's scroll-to control is disabled, and a scroll request leaves the page where it is

#### Scenario: Select a children prop

- **WHEN** the selected instance's `children` prop holds a component that rendered, and the user hovers then clicks it in the details
- **THEN** that instance is outlined in the page while hovered, and clicking selects it in the tree and details

### Requirement: Activities are editable from the HUD

The HUD SHALL list activities with their names and values, allow editing JSON-representable values in place and resetting, and show non-editable values read-only. In-place editing SHALL be available wherever an activity's value is shown, both in the activities list and in a selected instance's activities. Enter (or leaving the field) SHALL apply the edit, and Escape SHALL cancel it.

#### Scenario: Edit an activity

- **WHEN** the user changes a boolean toggle activity's value from `false` to `true`
- **THEN** the app re-renders as if the app had called `update(true)`

#### Scenario: Edit in place from the inspector

- **WHEN** the user selects an instance, clicks one of its activities' values, types `42` and presses Enter
- **THEN** the activity updates to `42` without leaving the inspector

#### Scenario: Cancel an edit

- **WHEN** the user starts editing a value and presses Escape
- **THEN** the field shows the activity's current value and no update is sent

#### Scenario: Invalid input

- **WHEN** the user enters text that is not valid JSON and presses Enter
- **THEN** the field stays in edit mode with an inline error and the activity is unchanged

### Requirement: Renders can be visualized

When render highlighting is on, each instance that renders SHALL briefly flash its outline in the page. The HUD SHALL show per-instance re-render counts observed since devtools connected, identified as such in the tree, and SHALL offer a control that resets every count to zero. Instances with no observed re-render SHALL show no count.

#### Scenario: Flash on update

- **WHEN** render highlighting is on and an activity update re-renders two instances
- **THEN** both instances' outlines flash once and their counts increase by one

#### Scenario: Count explains itself

- **WHEN** the user hovers an instance's render count in the tree
- **THEN** the HUD states that it counts re-renders since devtools connected

#### Scenario: Reset counts

- **WHEN** the user resets render counts
- **THEN** every count disappears until its instance renders again

### Requirement: Live objects can be sent to the page console

The HUD's log action SHALL log the selected instance's or activity's live object to the inspected page's console and expose it as `$loom` there. A logged activity SHALL be a plain snapshot that reads without custom formatters: name, value, pending state, scope and subscribing instances. The live handle SHALL be attached as `activity`.

#### Scenario: Log to console

- **WHEN** the user clicks log on a selected activity
- **THEN** the page console shows the activity's name, value, pending state, scope and subscribers, and `$loom.activity.update(…)` in the console updates it

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

### Requirement: The HUD can dock or float

`loom.devtools.open('dock')` SHALL show the HUD docked at the bottom or at the side edge (the right, or the left on right-to-left pages). The dock's position SHALL be automatic by default: at the side while the window leaves the page at least 600px beside the dock, otherwise at the bottom, switching as the window resizes. Choosing bottom or side by hand SHALL hold that position and turn automatic switching off until automatic is chosen again. `open('float')` and the HUD's pop-out control SHALL float the HUD over the page in a window that moves by a drag bar, resizes from any edge or corner, stays inside the viewport and reserves no page space; minimizing it SHALL leave a round button showing the loom logo, inset in the viewport's bottom-right corner each time it appears, which snaps into the nearer bottom corner after a drag and restores the window where it was last expanded on click. Docking from the floating window, or choosing a dock position, SHALL dock the HUD again. `open()` without a placement SHALL open the HUD where it was last. The position, the floating state and the floating window's rect SHALL persist in local storage across reloads and sessions, the window's rect under its own key, and a HUD open when the tab reloads SHALL reopen where it was until it is closed.

#### Scenario: Pop out floats over the page

- **WHEN** the user presses the pop-out control on a docked HUD
- **THEN** the HUD floats over the page at its last floating position, the page's reserved dock space is released, and the pop-out control becomes a dock control

#### Scenario: Move, resize and minimize

- **WHEN** the user drags the floating window's bar, drags its top-left corner and its bottom-right corner, then minimizes it and drags the minimized button into the left half
- **THEN** the window moves and grows or shrinks from the dragged side within the viewport; the button appears in the bottom-right corner, follows the pointer, snaps into the bottom-left corner on release, and a click restores the window where it was last expanded; minimized again, the button starts from the bottom-right

#### Scenario: An open HUD survives a reload

- **WHEN** the HUD is open, floating or docked, and the tab reloads
- **THEN** the HUD reopens where it was; after it is closed with its close control, a reload leaves it closed

#### Scenario: Dock from floating

- **WHEN** the HUD floats and the user presses the dock control or a dock position
- **THEN** the HUD docks at that position and reserves page space again

#### Scenario: Automatic position follows the window

- **WHEN** the dock is automatic and the window narrows until less than 600px of page would remain beside it
- **THEN** the dock moves to the bottom, and back to the side when the window widens again

#### Scenario: A chosen position holds

- **WHEN** the user chooses the side position and then narrows the window
- **THEN** the dock stays at the side until the user chooses automatic or bottom, and the choice survives a reload

### Requirement: The dock leaves the page usable

While the HUD is docked at either edge, expanded or collapsed to a bar, no page content SHALL stay covered by it:

- At the bottom, the inspected document SHALL scroll its last content clear of the dock, whatever the page's own `html` and `body` sizing, and each height-limited inner scroll area the dock covers, such as a sticky side nav, SHALL likewise scroll its last content clear.
- At the side, the page's flowing content SHALL narrow to the space beside the dock, and content that cannot narrow SHALL be reachable by scrolling sideways.
- At either edge, fixed-position elements the dock would cover SHALL be moved or shrunk to end at the dock's edge.

The page's media queries and viewport units keep measuring the whole window. Every adjustment SHALL be removed when the dock closes or moves. The dock SHALL be resizable by dragging its edge and collapsible to a bar. Its size and collapsed state SHALL persist across reloads.

#### Scenario: Scroll past the dock

- **WHEN** the dock is open over a page taller than the viewport and the user scrolls to the bottom
- **THEN** the page's last content sits above the dock, not behind it

#### Scenario: Viewport-high html and body

- **WHEN** the page sets `html` and `body` to the viewport's height and its content overflows them
- **THEN** scrolling to the bottom still brings the last content above the dock

#### Scenario: Covered side nav

- **WHEN** a sticky, viewport-high side nav runs under the dock
- **THEN** the side nav scrolls far enough to bring its last link above the dock

#### Scenario: Fixed bar under the bottom dock

- **WHEN** the page has a bar fixed to the bottom of the viewport and the dock opens at the bottom
- **THEN** the bar sits directly above the dock, and returns to the bottom when the dock closes

#### Scenario: Side dock beside a full-width header

- **WHEN** the dock opens at the side of a page with a full-width fixed header and a text column
- **THEN** the header ends at the dock's edge, the text column narrows to fit, and nothing renders under the dock

#### Scenario: Close removes the reservation

- **WHEN** the dock closes
- **THEN** the page's scroll extent returns to what it was before devtools docked

#### Scenario: Resize and collapse persist

- **WHEN** the user resizes the dock, collapses it, and reloads the page
- **THEN** the dock reopens collapsed, and expanding it restores the chosen size

### Requirement: Outlines never cover the HUD

Hover, selection and flash outlines SHALL be clipped to the visible page area, which excludes the dock, and to the instance's scrolling and clipping ancestors. When an outlined instance lies entirely outside that area, the page SHALL show an indicator at the nearest edge naming the instance and pointing toward it. Activating the indicator SHALL scroll the instance into view.

#### Scenario: Instance behind the dock

- **WHEN** the user hovers a tree node whose output is entirely behind the dock
- **THEN** no outline draws over the dock, and an indicator above the dock points down at that instance

#### Scenario: Instance scrolled above the viewport

- **WHEN** the selected instance has scrolled out above the viewport
- **THEN** an indicator at the top edge names it and points up, and activating it scrolls the instance into view

#### Scenario: Partly visible instance

- **WHEN** an outlined instance is partly behind the dock
- **THEN** only its visible part is outlined and no indicator shows

#### Scenario: Instance scrolled out of an inner scroll area

- **WHEN** an outlined instance sits inside an inner scroll area, scrolled out of it
- **THEN** no outline draws, and an indicator at that scroll area's edge points toward it

### Requirement: Activities show their scope

The HUD SHALL show, for each listed activity, both in the activities list and in a selected instance's activities:

- the rendered instances using it, grouped by name with a count, where choosing a group selects its next instance in the tree; or that no rendered instance uses it;
- whether it is owned by a component instance, naming that instance, or has no owner, saying that it lives at module scope or was created without `own()`.

Selecting the owner SHALL be possible from the activity. A selected instance's activity SHALL offer a way to show it in the activities list.

#### Scenario: Instance-owned activity

- **WHEN** an instance of `Counter` holds an activity through `own(() => activity(0))` and the user opens the activities list
- **THEN** that activity reads as owned by that `Counter` instance, and choosing the owner selects it in the tree

#### Scenario: Unowned activity

- **WHEN** an activity is created at module top level
- **THEN** it reads as having no owner

#### Scenario: Many users of one component

- **WHEN** sixteen `TocLink` instances bind the same activity
- **THEN** the activity reads as used by `TocLink ×16`, and choosing it repeatedly steps the selection through those instances

#### Scenario: Users agree across tabs

- **WHEN** the user views an activity from a selected instance and then in the activities list
- **THEN** both show the same users

#### Scenario: Show in the activities list

- **WHEN** the user chooses to show a selected instance's activity in the activities list
- **THEN** the activities list opens with that activity scrolled into view and briefly highlighted

#### Scenario: Activity driving an app root

- **WHEN** an app's root is an activity boundary that no component contains, such as the router's page effect
- **THEN** that activity is listed, with no users and no owner

### Requirement: The HUD stays usable over modal dialogs

While docked, the HUD and its page outlines SHALL stay above, and interactive over, an open modal dialog, and return to their place in the document when it closes, without losing the HUD's state where the browser can move a frame without reloading it.

#### Scenario: Inspect inside a modal

- **WHEN** the app opens a modal dialog, such as a search modal, while the HUD is docked
- **THEN** the HUD draws above the dialog and its backdrop, its controls respond, and picking can select the dialog's content

#### Scenario: Modal closes

- **WHEN** the modal dialog closes or is removed
- **THEN** the HUD returns to the document and stays connected

### Requirement: The side dock shows one panel at a time

When the HUD sits at the side, or its own width is too narrow for the tree and the details side by side, the Components tab SHALL show the tree alone, and selecting an instance SHALL transition to its details. The details header SHALL show the instance's ancestor path, each ancestor selecting that instance, and a control back to the tree. Returning SHALL show the tree with the selected row in view. Transitions SHALL be skipped when the user prefers reduced motion. Docked at the bottom with room for both, the tree and details SHALL show side by side.

#### Scenario: Select in the side dock

- **WHEN** the HUD is docked at the side and the user selects `TocLink` in the tree
- **THEN** the details slide in with the path `App › … › TocList › TocLink` and a back control, and going back shows the tree with `TocLink`'s row in view

#### Scenario: Pick in the side dock

- **WHEN** the HUD is docked at the side and the user picks an instance in the page
- **THEN** the HUD shows that instance's details with its path
