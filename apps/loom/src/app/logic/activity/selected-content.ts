import { activity } from '@loom-js/core';

import {
    ContentLoadFailure,
    PageSummary,
    Site,
    TopicProps
} from '@/app/logic/providers/contentful/lib/types';

export const page = activity<PageSummary | ContentLoadFailure | undefined>(
    undefined
);
export const site = activity<Site | undefined>(undefined);
export const topic = activity<TopicProps | ContentLoadFailure | undefined>(
    undefined
);
