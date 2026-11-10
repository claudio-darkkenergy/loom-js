import type { Unsubscriber, ValueProp } from '../../types';
import {
    DiagnosticSubjectRef,
    describeSubject
} from '../globals/diagnostic-format';
import { getPendingSubjects } from '../settlement';

/** The slice of an activity handle devtools reads and drives. */
export interface InspectableActivity {
    reset(): void;
    update(input: any): void;
    value(): unknown;
    watch(action: (valueProp: ValueProp<any>) => any): Unsubscriber;
}

// Each activity's diagnostic subject — the identity diagnostics already
// print (`⟨label⟩` or `activity#N`).
const activitySubjects = new WeakMap<
    InspectableActivity,
    DiagnosticSubjectRef
>();

/**
 * Records the diagnostic subject an activity is named by.
 * @param activity The activity handle.
 * @param subject Its diagnostic subject.
 */
export const recordActivity = (
    activity: InspectableActivity,
    subject: DiagnosticSubjectRef
) => {
    activitySubjects.set(activity, subject);
};

/**
 * Whether a value is an activity handle.
 * @param value Any value.
 */
export const isInspectableActivity = (
    value: unknown
): value is InspectableActivity =>
    typeof value === 'object' &&
    value !== null &&
    activitySubjects.has(value as InspectableActivity);

/**
 * Labels an activity that has no label yet — what the loom build tool
 * injects from an activity's binding. An explicit `label` always wins.
 * @param activity The activity handle (anything else passes through).
 * @param name The label to give it.
 * @returns The same value, for use inline.
 */
export const nameActivity = <Value>(activity: Value, name: string): Value => {
    const subject = activitySubjects.get(activity as InspectableActivity);

    subject && !subject.label && (subject.label = name);

    return activity;
};

/**
 * Describes an activity for inspection: its diagnostic name, whether that
 * name is a label, its current value and whether a transform run is in
 * flight.
 * @param activity The activity handle.
 * @returns The activity's name, label state, value and pending state.
 */
export const describeActivity = (activity: InspectableActivity) => {
    const subject = activitySubjects.get(activity);

    return {
        labeled: !!subject?.label,
        name: subject ? describeSubject(subject) : 'activity',
        pending: !!subject && getPendingSubjects().includes(subject),
        value: activity.value()
    };
};
