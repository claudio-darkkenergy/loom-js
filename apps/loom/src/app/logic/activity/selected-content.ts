import {
    Page,
    Site,
    TopicProps
} from '@/app/logic/providers/contentful/lib/types';
import { activity } from '@loom-js/core';

export const page = activity<Page | undefined>(undefined);
export const site = activity<Site | undefined>(undefined);
export const topic = activity<TopicProps | undefined>(undefined);
