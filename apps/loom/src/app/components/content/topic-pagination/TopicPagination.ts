import { component, el, route, type TemplateTagValue } from '@loom-js/core';
import { PinkButton } from '@loom-js/pink';
import classNames from 'classnames';

import styles from './TopicPagination.module.css';

export interface TopicPaginationItem {
    slug?: string;
    title?: TemplateTagValue;
}

export interface TopicPaginationProps {
    currentSlug?: string;
    items?: TopicPaginationItem[];
}

/**
 * Previous/next topic navigation, derived from the page listing order and the
 * current topic slug — no authored pagination data. Boundary topics render
 * only the link that exists (a placeholder keeps the next link right-aligned).
 */
export const TopicPagination = component<TopicPaginationProps>(
    (html, { currentSlug, items = [] }) => {
        const currentIndex = items.findIndex(
            ({ slug }) => slug === currentSlug
        );
        const previousTopic =
            currentIndex > 0 ? items[currentIndex - 1] : undefined;
        const nextTopic =
            currentIndex >= 0 && currentIndex < items.length - 1
                ? items[currentIndex + 1]
                : undefined;
        const topicLink = (
            topicItem: TopicPaginationItem,
            relation: 'next' | 'prev'
        ) =>
            PinkButton({
                // The next link trails its icon; the previous link leads
                // with it.
                appendIcon: relation === 'next',
                attrs: { rel: relation },
                children: topicItem.title,
                className: styles.topicLink,
                href: topicItem.slug,
                icon:
                    relation === 'next'
                        ? 'icon-cheveron-right'
                        : 'icon-cheveron-left',
                isSecondary: true,
                onClick: route
            });

        return html`
            <nav
                $attrs=${{ 'aria-label': 'Topic pagination' }}
                class=${classNames(
                    styles.topicPagination,
                    'u-flex u-main-space-between u-gap-16 u-margin-block-start-40'
                )}
            >
                ${previousTopic ? topicLink(previousTopic, 'prev') : el('span')({})}
                ${nextTopic ? topicLink(nextTopic, 'next') : el('span')({})}
            </nav>
        `;
    }
);
