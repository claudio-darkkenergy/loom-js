import { el, route, simple, type SyntheticRouteEvent } from '@loom-js/core';
import { withAnchorLink } from '@loom-js/pink';
import { toKebabCase } from '@loom-js/utils';

// The anchor id convention the on-page TOC (`TopicToc`) links to: the h2's
// text kebab-cased with punctuation stripped — matching GitHub's slugger, so
// a heading's anchor is identical on the docs site and in the rendered
// README. Kept as one helper so the heading and the TOC can't drift apart.
export const headingAnchorId = (headingText: string) =>
    toKebabCase(headingText).replace(/[^a-z0-9-_]/g, '');

// The anchor routes through loom so a same-page fragment stays a quiet
// `pushState` — a native hash jump fires `popstate`, which re-renders the
// docs content and would drop the copied state mid-feedback. `scroll: false`
// because the reader is already at the heading they're copying: the URL
// updates, the viewport stays put.
const routeToAnchor = (event: Event) =>
    route(event as SyntheticRouteEvent<HTMLAnchorElement>, { scroll: false });

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type AnchoredHeadingProps = {
    anchorClassName?: string;
    anchorId: string;
    children?: unknown;
    className?: string;
    // The heading rank — renders the matching h1–h6. Defaults to 2, the top
    // body-heading level in docs content (the topic title owns h1).
    level?: HeadingLevel;
};

/**
 * An h1–h6 carrying its TOC anchor id and copy-link affordance, via pink's
 * `withAnchorLink` modifier over a polymorphic heading root.
 */
export const AnchoredHeading = simple<AnchoredHeadingProps>(
    ({ anchorClassName, anchorId, children, className, level = 2 }) =>
        el(`h${level}`)(
            withAnchorLink({
                anchorId,
                anchorProps: {
                    buttonSize: '1.5rem',
                    className: anchorClassName,
                    onClick: routeToAnchor,
                    popupClassName: 'is-bottom is-center'
                },
                children,
                className
            })
        )
);
