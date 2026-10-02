// The prerender bundle: an extra entry point of the client build, so the
// prerendered markup gets the same minified css-module class names and the
// same core module instance as the shipped app. Only the build runner loads it.
import { documentToMarkdown, inlineToMarkdown } from '@loom-js/contentful';
import {
    dehydrate,
    renderToString,
    serializeState
} from '@loom-js/core/server';

import { App } from './app';
import { asCodeBlock } from './components/content/styled-rich-text/lib/code';
import { BENCH_RESULTS_RESOURCE_KEY } from './logic/activity/bench-results';
import { pageContentResourceKey } from './logic/activity/page-content';
import { flattenListing, listingSections } from './logic/listing';
import { getPageContent } from './logic/providers/contentful';
import { setContentfulTransport } from './logic/providers/contentful/lib/contentful-request';
import { DOCS_PAGE_SLUG } from './pages/constants';

// The build runner seeds the benchmark results into this bundle before
// rendering, and checks the key in the route's dehydrated state after.
export { seedBenchResults } from './logic/providers/bench-results';
export const benchResultsResourceKey = BENCH_RESULTS_RESOURCE_KEY;

export interface PrerenderTransportConfig {
    spaceId: string;
    token: string;
}

export interface DocsTopicSummary {
    slug: string;
    title: string;
}

export interface DocsSectionSummary {
    title: string;
    topics: DocsTopicSummary[];
}

export interface DocsTopicText {
    /** The topic's lead paragraph, as markdown. */
    lead: string;
    /** The whole topic body, as markdown. */
    markdown: string;
}

/**
 * Points the Contentful providers directly at Contentful's GraphQL API.
 * The `/api` proxy only exists at runtime, so build-time renders call
 * Contentful itself, authorized with the Delivery token.
 */
export const configurePrerenderTransport = ({
    spaceId,
    token
}: PrerenderTransportConfig) =>
    setContentfulTransport({
        headers: { Authorization: `Bearer ${token}` },
        // POST: the GET transport can't carry auth headers.
        method: 'POST',
        url: `https://graphql.contentful.com/content/v1/spaces/${spaceId}/environments/master`
    });

/**
 * Lists the docs topics from the Contentful page listing — the same list
 * the side nav shows, flattened from its nav groups back into the
 * learning-path order. Throws when the listing is missing or empty, so a
 * bad build fails instead of shipping empty pages.
 */
export const listDocsTopics = async (): Promise<DocsTopicSummary[]> => {
    const { data, error } = await getPageContent(DOCS_PAGE_SLUG, '');
    const topics = flattenListing(data?.page?.contentCollection?.items).flatMap(
        ({ slug, title }) =>
            typeof slug === 'string'
                ? [{ slug, title: typeof title === 'string' ? title : '' }]
                : []
    );

    if (error || !topics?.length) {
        throw new Error(
            `[prerender] docs page listing failed: ${error || 'no topics returned'}`
        );
    }

    return topics;
};

/**
 * Lists the docs topics as the side nav groups them. Ungrouped topics
 * arrive in a section with an empty title.
 */
export const listDocsSections = async (): Promise<DocsSectionSummary[]> => {
    const { data, error } = await getPageContent(DOCS_PAGE_SLUG, '');
    const sections = listingSections(data?.page?.contentCollection?.items).map(
        ({ items, title }) => ({
            title: typeof title === 'string' ? title : '',
            topics: items.flatMap(({ slug, title: topicTitle }) =>
                typeof slug === 'string'
                    ? [
                          {
                              slug,
                              title:
                                  typeof topicTitle === 'string'
                                      ? topicTitle
                                      : ''
                          }
                      ]
                    : []
            )
        })
    );

    if (error || !sections.length) {
        throw new Error(
            `[prerender] docs page listing failed: ${error || 'no sections returned'}`
        );
    }

    return sections;
};

/**
 * Serializes one topic's body to markdown, from the same Contentful entry
 * its page renders. Links resolve against `origin`, since the text is read
 * away from the site.
 */
export const docsTopicText = async (
    topicSlug: string,
    origin: string
): Promise<DocsTopicText> => {
    const { data, error } = await getPageContent(DOCS_PAGE_SLUG, topicSlug);
    const richTextDocument = data?.topic?.description?.json;

    if (error || !richTextDocument) {
        throw new Error(
            `[prerender] docs topic "${topicSlug}" failed to load: ${error || 'no body returned'}`
        );
    }

    const options = {
        codeBlock: asCodeBlock,
        resolveUrl: (uri: string) =>
            uri.startsWith('/') ? origin.concat(uri) : uri
    };
    const [leadNode] = richTextDocument.content;

    return {
        lead:
            leadNode?.nodeType === 'paragraph' && !asCodeBlock(leadNode)
                ? inlineToMarkdown(leadNode, options)
                : '',
        markdown: documentToMarkdown(richTextDocument, options)
    };
};

// The server entry's d.ts duplicates core's shared types, so the same
// runtime `ContextFunction` fails to type-check across the two bundles —
// cast at this one boundary until the type rollup is unified.
type ServerRenderable = Parameters<typeof renderToString>[0];

/**
 * Builds the resource-cache key for a docs topic — the key the prerender
 * runner expects to find in each route's dehydrated state.
 */
export const docsContentResourceKey = (topicSlug: string) =>
    pageContentResourceKey(DOCS_PAGE_SLUG, topicSlug);

/**
 * Renders one route and captures its dehydrated state. Reusable on its own:
 * a future on-demand (ISR) function can call it with its own window.
 */
export const prerenderRoute = async (url: string, window: object) => {
    const html = await renderToString(App() as unknown as ServerRenderable, {
        // Build-time Contentful calls get extra slack; the runner's output
        // validation catches a route that still couldn't settle.
        maxWait: 15000,
        url,
        window
    });

    return { html, state: serializeState(dehydrate(window)) };
};
