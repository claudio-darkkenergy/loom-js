export type MediaQueryListEventHandler = (
    this: MediaQueryList,
    ev: MediaQueryListEventMap['change']
) => any;

/**
 * Listens to changes on mediaQuery. Implements window.matchMedia (`MediaQueryList` API.)
 * See: https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Testing_media_queries.
 * @example
 *  const mobileWidth = useMediaQuery(minWidth('xxs'), maxWidth('md'));
 *  // mobileWidth === { event: { matches: boolean, media: string }}
 */
export const matchQuery = (
    onChange: MediaQueryListEventHandler,
    ...queries: string[]
) => {
    // When we have more than one media query, join each string with ' and ', making it a valid
    // media query.
    const mediaQuery = queries.join(' and ');
    const mql = window.matchMedia(mediaQuery);

    // Initially trigger 'onChange', and setup event-listener
    onChange.call(mql, {
        matches: mql.matches,
        media: mql.media
    } as MediaQueryListEvent);
    mql.addEventListener('change', ({ currentTarget, target }) => {
        const mqlTarget = (target || currentTarget) as MediaQueryList;

        onChange.call(mqlTarget, {
            matches: mqlTarget.matches,
            media: mqlTarget.media
        } as MediaQueryListEvent);
    });

    return {
        // Remove the mql listener.
        unsubscribeMql: () => mql.removeEventListener('change', onChange)
    };
};
