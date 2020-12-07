import {
    ActivityContext,
    ActivityEffect,
    ActivityHandler,
    ActivityUpdate,
    ActivityWorkers,
    TemplateTagValue
} from './types';

export const Activity: <T>(defaultValue?: T) => ActivityWorkers<T> = <T>(
    defaultValue?: T
) => {
    // const weakActivitySet = new WeakSet();
    const activities = new Map<ActivityHandler<T>, ActivityContext>();

    const effect: ActivityEffect<T> = (handler) => {
        // const [cachedHandler, cachedCtx] =
        //     (activities.size > 0 && activities.entries().next().value) || [];
        // const ctx = cachedCtx || {};
        // let result: TemplateTagValue;

        // activities.delete(cachedHandler);
        let cachedHandlers = new Map();
        const ctx = {};
        let memoCounter = 0;
        const memo = (memoHandler) => {
            const cachedHandler = cachedHandlers.get(memoCounter);

            // if (!cachedHandler) {
            //     cachedHandlers.set(memoCounter, memoHandler);
            //     memoHandler();
            // } else {
            //     cachedHandler();
            // }

            activities.get(handler);
            return memoHandler;
        };
        const result = handler({ ctx, memo, value });

        memoCounter = 0;
        activities.set(new WeakRef(handler), ctx);
        // weakActivitySet.add(handler);

        return result;
    };
    // const memo: any = (handler) => {
    //     const [cached];
    //     let result;
    //     result = handler(ctx);
    //     return result;
    // };
    const update: ActivityUpdate<T> = (newValue) => {
        value = newValue;
        activities.forEach((ctx, handler) => {
            if (weakActivitySet.has(handler)) {
                // Call the cached handler.
                handler({ value, ctx });
            } else {
                // Cleanup
                activities.delete(handler);
            }
        });
    };
    let value = defaultValue;

    return {
        defaultValue,
        effect,
        // get memo() {
        //     return (handler) => {
        //         cachedHandlers.set(handler, ctx);
        //         return memo(handler);
        //     };
        // },
        update,
        get value() {
            return value;
        }
    };
};
