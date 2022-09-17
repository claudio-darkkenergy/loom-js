type Observer = MutationObserver | ResizeObserver;

export const useObserver = <InitOptions>(
    observer: Observer,
    options?: InitOptions
) => ({
    ...observer,
    observe: (scope: Element, optionsOverride?: InitOptions) =>
        observer.observe(scope, Object.assign(options, optionsOverride))
});

export const useMutationObserver = (
    handler: MutationCallback,
    options?: MutationObserverInit
) => useObserver(new MutationObserver(handler), options) as MutationObserver;

export const useResizeObserver = (
    handler: ResizeObserverCallback,
    options?: ResizeObserverOptions
) => useObserver(new ResizeObserver(handler), options) as ResizeObserver;
