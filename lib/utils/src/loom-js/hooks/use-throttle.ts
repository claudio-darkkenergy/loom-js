export const useThrottle = (delayMs = 0) => {
    let timeoutId = 0;
    const throttle = (action: () => Promise<unknown>) => {
        let promise: Promise<unknown>;

        clearTimeout(timeoutId);

        promise = new Promise((resolve) => {
            timeoutId = setTimeout(async () => {
                const result = await action();
                resolve(result);
            }, delayMs) as unknown as number;
        });

        return promise;
    };

    return { cancel: () => clearTimeout(timeoutId), throttle };
};
