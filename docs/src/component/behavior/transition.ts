import {
    activity,
    ActivityTransform,
    component,
    ContextFunction
} from '@loomjs/core';

interface TransitionActivityInput {
    event?: TransitionEvent | null;
    phase?: TransitionPhase;
    stage?: TransitionStage;
}

interface TransitionActivityValue {
    event: TransitionEvent | null;
    phase: TransitionPhase;
    stage: TransitionStage;
}

export interface TransitionChildrenProps {
    // Initiates the "enter" phase.
    enter(): void | Promise<void>;
    event: TransitionEvent | null;
    // Initiates the "leave" phase.
    leave(): void | Promise<void>;
    // Initiates the "leave" phase.
    // The current transition phase.
    phase: TransitionPhase;
    // The current transition stage.
    stage: TransitionStage;
    // Toggles the transition phase.
    toggle(): void | Promise<void>;
}

type TransitionEventHandler = (event: TransitionEvent) => void | Promise<void>;

export enum TransitionPhase {
    enter = 'enter',
    leave = 'leave'
}

export interface TransitionProps {
    animation(props: TransitionChildrenProps): ContextFunction;
}

export enum TransitionStage {
    cancel = 'cancel',
    end = 'end',
    run = 'run',
    start = 'start'
}

const useTransition: ActivityTransform<
    TransitionActivityValue,
    TransitionActivityInput
> = ({ input: { event = null, phase, stage = null }, update, value }) => {
    update({
        event,
        phase: phase || value.phase,
        stage
    });
};

export const Transition = component<TransitionProps>(
    (html, { animation, className, onMounted, onUnmounted }) => {
        // Activity setup
        const {
            effect: transitionEffect,
            update: runTransition,
            value
        } = activity<TransitionActivityValue, TransitionActivityInput>(
            {
                event: null,
                phase: TransitionPhase.leave,
                stage: TransitionStage.end
            },
            useTransition
        );

        // Preset the activity update helpers - `enter`, `leave` & `toggle`
        const enter = () => runTransition({ phase: TransitionPhase.enter });
        const leave = () => runTransition({ phase: TransitionPhase.leave });
        const toggle = () =>
            runTransition({
                phase:
                    value().phase === TransitionPhase.enter
                        ? TransitionPhase.leave
                        : TransitionPhase.enter
            });

        // `TransitionEvent` listeners
        // Updates the activity w/ the current transition stage based on `TranstionEvent`s.
        const transitionRunHandler: TransitionEventHandler = (event) =>
            runTransition({ event, stage: TransitionStage.run });
        const transitionStartHandler: TransitionEventHandler = (event) =>
            runTransition({
                event,
                stage: TransitionStage.start
            });
        const transitionEndHandler: TransitionEventHandler = (event) =>
            runTransition({ event, stage: TransitionStage.end });
        const transitionCancelHandler: TransitionEventHandler = (event) =>
            runTransition({
                event,
                stage: TransitionStage.cancel
            });

        onMounted((node) => {
            // Do setup.
            // Add the `TransitionEvent` listeners.
            node.addEventListener('transitionrun', transitionRunHandler);
            node.addEventListener('transitionstart', transitionStartHandler);
            // Only one of end or cancel events will fire.
            node.addEventListener('transitionend', transitionEndHandler);
            node.addEventListener('transitioncancel', transitionCancelHandler);
        });

        onUnmounted((node) => {
            // Do cleanup.
            node.removeEventListener('transitionrun', transitionRunHandler);
            node.removeEventListener('transitionstart', transitionStartHandler);
            node.removeEventListener('transitionend', transitionEndHandler);
            node.removeEventListener(
                'transitioncancel',
                transitionCancelHandler
            );
        });

        return html`
            <div class=${className}>
                ${transitionEffect(({ value: { event, phase, stage } }) =>
                    animation({
                        enter,
                        event,
                        leave,
                        phase,
                        stage,
                        toggle
                    })
                )}
            </div>
        `;
    }
);
