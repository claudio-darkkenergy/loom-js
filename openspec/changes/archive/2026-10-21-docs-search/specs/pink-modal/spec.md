## ADDED Requirements

### Requirement: PinkModal renders Pink Design's modal over a native dialog

`@loom-js/pink` SHALL export `PinkModal`, rendering `dialog.modal` → `form.modal-form[method="dialog"]` → `header.modal-header` (an `h4.modal-title.heading-level-5` from `title` plus a `button.is-text.is-small.is-only-icon` close button with `aria-label="Close modal"` and `icon-x`) → `div.modal-content > div.modal-content-spacer` holding `children` → `div.modal-footer` holding the `footer` slot when given. The `size` prop SHALL map to `is-small` / `is-big` / `is-huge`; omitted means the default (medium) width. The component SHALL carry no behavior beyond the modal itself.

#### Scenario: Markup follows pink

- **WHEN** `PinkModal` renders with a title and content
- **THEN** the DOM matches pink's documented modal structure and pink's `_modal.scss` styles it without app-local CSS

#### Scenario: Footer is optional

- **WHEN** no `footer` is given
- **THEN** no `modal-footer` element renders

### Requirement: The header variants and description follow pink

`isSeparateHeader` SHALL add pink's `is-separate-header` class (a border between header and content), and `description` SHALL render as a paragraph inside the header under the title row, as pink's documented markup places it.

#### Scenario: Separate header

- **WHEN** `PinkModal` renders with `isSeparateHeader` and a `description`
- **THEN** the dialog carries `is-separate-header` and the header holds the title row followed by a `<p>` with the description

### Requirement: A headerStart slot precedes the title, and the title labels the dialog

A `headerStart` named slot SHALL render inside the header's title row, before the title heading (pink's avatar position), so block content never lands inside the heading. The title heading SHALL carry an id — `<id>-title` when the caller passes `id`, an instance-unique id otherwise — and the dialog SHALL reference it through `aria-labelledby`.

#### Scenario: Avatar before the title

- **WHEN** a caller supplies `<div slot="headerStart" class="avatar">…</div>` as a child
- **THEN** the avatar renders as the title row's first child, a sibling of the `h4`, and not in the content region

#### Scenario: Dialog is labelled

- **WHEN** `PinkModal` renders with `id="delete"`
- **THEN** the `h4` has `id="delete-title"` and the dialog has `aria-labelledby="delete-title"`

### Requirement: Escape and outside-click closing are props

`closeOnEscape` (default `true`) SHALL decide whether the dialog's native cancel (Escape) closes it; `closeOnOutsideClick` (default `false`) SHALL decide whether a click on the backdrop closes it. Both close paths SHALL report through `onClose` like every other.

#### Scenario: Escape disabled

- **WHEN** `closeOnEscape` is false and the user presses Escape
- **THEN** the dialog stays open and `onClose` is not called

#### Scenario: Backdrop click enabled

- **WHEN** `closeOnOutsideClick` is true and the user clicks the backdrop outside the modal
- **THEN** the dialog closes and `onClose` is called once

#### Scenario: Backdrop click disabled

- **WHEN** `closeOnOutsideClick` is false (the default) and the user clicks the backdrop
- **THEN** the dialog stays open

### Requirement: Opening focuses the most sensible control

On open the modal SHALL focus, in order of preference: an element inside it carrying `autofocus`, else the first focusable control in the content region, else the first focusable control in the footer, else the native choice (the close button).

#### Scenario: Form content

- **WHEN** a modal whose content holds an input opens
- **THEN** that input has focus

#### Scenario: Confirmation content

- **WHEN** a modal with text-only content and footer buttons opens
- **THEN** the first footer button has focus

### Requirement: Open state is a prop, close is one callback

`isOpen` SHALL drive the native `showModal()` / `close()` once the node is live (never while detached), and every way the dialog closes — Escape, the close button, the `method="dialog"` form, or `isOpen` turning false — SHALL fire `onClose` exactly once through the dialog's native `close` event, so a consumer's state cannot drift from the element's.

#### Scenario: Prop opens

- **WHEN** `isOpen` changes from false to true after mount
- **THEN** `showModal()` has run, the backdrop is shown and focus is inside the dialog

#### Scenario: Escape closes and reports

- **WHEN** the dialog is open and the user presses Escape
- **THEN** the dialog closes and `onClose` is called once

#### Scenario: Close button closes and reports

- **WHEN** the user activates the header's close button
- **THEN** the dialog closes and `onClose` is called once

#### Scenario: Server render is inert

- **WHEN** the component renders with `isOpen: false` in a server render
- **THEN** the markup contains the closed dialog and no `open` attribute

### Requirement: PinkModal ships like every pink component

The component SHALL live under `packages/pink/src/components/pink-modal/`, be exported from the package barrel, have Storybook stories mirroring pink's documentation (default, sizes, separate header, best practice) with every prop exposed as a control, and land with a minor changeset.

#### Scenario: Consumer import

- **WHEN** a consumer imports `{ PinkModal } from '@loom-js/pink'`
- **THEN** the component and its props type resolve

#### Scenario: Story present

- **WHEN** Storybook runs
- **THEN** the `PinkModal` stories open a modal in each size, with the separate header, and with the best-practice deletion example, and toggling the `isOpen` control opens and closes the modal
