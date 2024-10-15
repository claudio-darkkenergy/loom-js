import { redirect, watchRoute } from '@loom-js/core';

export const useDefaultTopicRedirect = (defaultTopic = '') => {
    watchRoute(async ({ value: routeValue }) => {
        if (!routeValue.params.topic && defaultTopic) {
            redirect(defaultTopic);
        }
    });
};
