## ADDED Requirements

### Requirement: Diagnostic output follows one scannable anatomy

Every loom console line SHALL present the badge, scope, subject, event, and detail as distinct segments — styled where the console supports it, plain otherwise — composed as arguments to the bound native method so call-site attribution is preserved. Subjects SHALL be identifiable: an opt-in `label` on activities, stable generated tags otherwise. Always-on warnings SHALL carry a one-clause remedy or concept pointer. Settlement-bound diagnostics SHALL enumerate the labeled subjects still pending alongside the count.

#### Scenario: narration lines are traceable

- **WHEN** two labeled activities narrate under the activity scope
- **THEN** each line's subject segment distinguishes them, and an unlabeled third shows its stable generated tag

#### Scenario: styling never costs attribution

- **WHEN** a styled diagnostic prints in a supporting browser
- **THEN** the console still attributes the message to the framework call site (no wrapper frames)

#### Scenario: a maxWait expiry names the laggards

- **WHEN** a bounded settlement wait expires with labeled work pending
- **THEN** the warning lists the pending subjects (capped), not only their count

#### Scenario: warnings state the fix

- **WHEN** any always-on warning prints
- **THEN** its final clause names the remedy or the docs concept that resolves it
