import { topic } from '../activity/selected-content';
import { getContentBySlug } from '@/app/logic/providers/contentful';

export const useSelectedTopic = async (selectedTopic = '') => {
    if (!selectedTopic) {
        return;
    }

    const { update } = topic;
    // Clear the topic while fetching the next topic data.
    update(undefined);

    const { data } = await getContentBySlug(selectedTopic);
    data && update(data);
};
