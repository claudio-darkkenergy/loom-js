// The diagnostics style contract (`diagnostics-output-quality`): every loom
// console line presents badge · scope · subject · event · detail as distinct
// segments, composed as an argument array for the bound native console
// methods — the formatter never wraps a method, so call-site attribution
// survives styling.

// A diagnostic-only identity for the thing a line concerns — an activity,
// element, or template. Labels are opt-in; unlabeled subjects resolve to a
// stable generated tag on first use.
export interface DiagnosticSubjectRef {
    kind: string;
    label?: string;
}

export interface DiagnosticSegments {
    detail?: string;
    event: string;
    // The one-clause fix or docs-concept pointer every always-on warning
    // carries — text only, no URLs (docs anchors churn; concept names don't).
    remedy?: string;
    scope: string;
    subject?: DiagnosticSubjectRef;
}

// How many pending subjects a bounded-settlement warning lists before
// collapsing the rest into an overflow count.
export const PENDING_LIST_CAP = 5;

// %c segment styling is a devtools capability; server consoles get the same
// segments as plain text. Sniffed once against the real browser global — not
// the provider seam — because diagnostics print to the host console, never
// to an injected window.
const supportsStyling =
    typeof globalThis.window !== 'undefined' &&
    typeof globalThis.window.document !== 'undefined';

const BADGE_STYLE =
    'background:#6d28d9;color:#fff;border-radius:3px;padding:1px 4px;font-weight:600';
const SCOPE_STYLE = 'color:#6d28d9;font-weight:600';
const SUBJECT_STYLE = 'color:#0e7490;font-weight:600';
const TEXT_STYLE = '';

// Generated tags are lazy — assigned on a subject's first diagnostic use,
// then stable for the subject's lifetime. Counters are per kind, so tags
// read `activity#3`, never a global ordinal.
const generatedTags = new WeakMap<DiagnosticSubjectRef, string>();
const kindCounts = new Map<string, number>();

export const createDiagnosticSubject = (
    kind: string,
    label?: string
): DiagnosticSubjectRef => ({ kind, label });

export const describeSubject = (subject: DiagnosticSubjectRef): string => {
    if (subject.label) {
        return `⟨${subject.label}⟩`;
    }

    let tag = generatedTags.get(subject);

    if (!tag) {
        const ordinal = (kindCounts.get(subject.kind) ?? 0) + 1;

        kindCounts.set(subject.kind, ordinal);
        tag = `${subject.kind}#${ordinal}`;
        generatedTags.set(subject, tag);
    }

    return tag;
};

/**
 * Renders a pending count with its labeled subjects — "3 pending —
 * ⟨page-content⟩, ⟨search⟩, activity#7" — listing at most
 * `PENDING_LIST_CAP` subjects and collapsing the rest into "(+N more)".
 * @param count The pending-operation count.
 * @param subjects The still-pending subject refs (see `getPendingSubjects`).
 * @returns The enumeration string for a warning's detail segment.
 */
export const describePending = (
    count: number,
    subjects: DiagnosticSubjectRef[]
): string => {
    const listed = subjects.slice(0, PENDING_LIST_CAP).map(describeSubject);
    const overflow = subjects.length - listed.length;

    return listed.length
        ? `${count} pending — ${listed.join(', ')}${
              overflow ? ` (+${overflow} more)` : ''
          }`
        : `${count} pending`;
};

/**
 * Builds the argument array for one diagnostic line — spread it into the
 * bound `loomConsole` method (`loomConsole.warn(...formatDiagnostic(...))`),
 * with any trailing data objects appended after the spread. Styled consoles
 * get `%c` segment styling; others get the same line as one plain string.
 * @param segments The line's anatomy — scope and event required.
 * @returns The console-method argument array.
 */
export const formatDiagnostic = (
    { detail, event, remedy, scope, subject }: DiagnosticSegments,
    { styled = supportsStyling }: { styled?: boolean } = {}
): [string, ...string[]] => {
    const subjectText = subject && describeSubject(subject);
    const message = [event, detail, remedy].filter(Boolean).join(' — ');

    if (!styled) {
        return [
            `[loom] ${scope}${subjectText ? ` ${subjectText}` : ''} ${message}`
        ];
    }

    const styles = [BADGE_STYLE, SCOPE_STYLE];
    let template = `%c[loom]%c ${scope}`;

    if (subjectText) {
        styles.push(SUBJECT_STYLE);
        template += `%c ${subjectText}`;
    }

    styles.push(TEXT_STYLE);
    template += `%c ${message}`;

    return [template, ...styles];
};
