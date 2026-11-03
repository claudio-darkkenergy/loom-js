// Page titles, shared by the prerender pass and the client so a prerendered
// route and a navigated one always carry the same title.
import { RoutePath } from '@/app/pages/constants';

/** The title of a section shell, keyed by its route scope. */
export const sectionTitle = (scope: string) =>
    scope === '/docs'
        ? 'Docs | Loomjs'
        : scope === RoutePath.Benchmarks
          ? 'Benchmarks | Loomjs'
          : 'Home | Loomjs';

/** The title of one docs topic's page. */
export const topicPageTitle = (topicTitle: string) =>
    `${topicTitle} | Loomjs docs`;
