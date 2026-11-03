import {
    type ComponentOutputProps,
    type RouteValue,
    watchRoute
} from '@loom-js/core';

import { topic } from '../activity/selected-content';
import { sectionTitle, topicPageTitle } from '@/app/page-title';
import { RoutePath } from '@/app/pages/constants';

type TitleHost = Pick<ComponentOutputProps, 'onMounted' | 'onUnmounted'>;

const docsTopicTitle = (topicSlug: string | undefined) => {
    const heldTopic = topic.value();

    return heldTopic &&
        !('contentError' in heldTopic) &&
        heldTopic.slug === topicSlug &&
        typeof heldTopic.title === 'string'
        ? topicPageTitle(heldTopic.title)
        : sectionTitle('/docs');
};

const titleOf = ({ matchedRoute, params }: RouteValue) =>
    matchedRoute === RoutePath.Docs
        ? docsTopicTitle(params.topic)
        : sectionTitle(
              matchedRoute === RoutePath.Benchmarks ? matchedRoute : '/'
          );

/**
 * Keeps `document.title` on the current route's title — the prerendered one
 * on first paint, then each navigation's, including a docs topic's once its
 * content lands. Browser-only: the watchers start in `onMounted`.
 */
export const useDocumentTitle = ({ onMounted, onUnmounted }: TitleHost) => {
    let currentRoute: RouteValue | undefined;
    const applyTitle = () => {
        if (currentRoute) {
            document.title = titleOf(currentRoute);
        }
    };
    const teardowns: (() => void)[] = [];

    onMounted(() => {
        teardowns.push(
            watchRoute(({ value: routeValue }) => {
                currentRoute = routeValue;
                applyTitle();
            }),
            topic.watch(applyTitle)
        );
    });
    onUnmounted(() =>
        teardowns.splice(0).forEach((unsubscribe) => unsubscribe())
    );
};
