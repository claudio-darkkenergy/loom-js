import {
    ActivityContext,
    ActivityEffect,
    ActivityHandler,
    ActivityUpdate,
    ActivityWorkers
    // TemplateTagValue
} from './types';

export const Activity: <T>(defaultValue?: T) => ActivityWorkers<T> = <T>(
    defaultValue?: T
) => {
    const activities = new Map<ActivityHandler<T>, ActivityContext>();
    const effect: ActivityEffect<T> = (handler) => {
        const ctx = {};
        const fragment = handler({ ctx, value });

        // Cache the activity handler w/ the context.
        activities.set(handler, ctx);

        return fragment;
    };
    const update: ActivityUpdate<T> = (newValue) => {
        const liveActivities = Array.from(activities).filter(
            ([handler, ctx]) => {
                const isActivityAlive = document.contains(ctx.node);
                if (!isActivityAlive) {
                    // Cleanup
                    activities.delete(handler);
                }

                return isActivityAlive;
            }
        );

        value = newValue;
        // Call the cached handlers.
        liveActivities.forEach(([handler, ctx]) => handler({ ctx, value }));
    };
    let value = defaultValue;

    return {
        defaultValue,
        effect,
        update,
        get value() {
            return value;
        }
    };
};
