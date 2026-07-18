import { topicTocToggle } from '../activity/toggles';
import { useToggle } from '@loom-js/utils';

/**
 * Toggles the topic table of contents activity based on media query matches.
 * @param when The media queries to watch.
 */
export const useTopicTocToggle = (...when: string[]) => {
    useToggle(topicTocToggle, ...when);
};
