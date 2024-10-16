import { page } from '../activity/selected-content';
import { getPageBySlug } from '@/app/logic/providers/contentful';

export const useSelectedPage = async (selectedPage = '') => {
    if (!selectedPage) {
        return;
    }

    const { update } = page;
    const { data, error, status } = await getPageBySlug(selectedPage);

    console.log({ selectedPage, data, error, status });
    data && update(data);
};