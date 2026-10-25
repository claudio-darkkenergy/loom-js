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
 * Describes an activity for inspection: its diagnostic name, current value
 * and whether a transform run is in flight.
 * @param activity The activity handle.
 * @returns The activity's name, value and pending state.
 */
export const describeActivity = (activity: InspectableActivity) => {
    const subject = activitySubjects.get(activity);

    return {
        name: subject ? describeSubject(subject) : 'activity',
        pending: !!subject && getPendingSubjects().includes(subject),
        value: activity.value()
    };
};
