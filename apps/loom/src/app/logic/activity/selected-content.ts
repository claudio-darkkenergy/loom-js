import { activity } from '@loom-js/core';

import {
    ContentLoadFailure,
    Page,
    Site,
    TopicProps
} from '@/app/logic/providers/contentful/lib/types';

export const page = activity<Page | ContentLoadFailure | undefined>(undefined);
export const site = activity<Site | undefined>(undefined);
export const topic = activity<TopicProps | ContentLoadFailure | undefined>(
    undefined
);
