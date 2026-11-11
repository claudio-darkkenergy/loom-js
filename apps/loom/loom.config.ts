import type { BenchResults } from '@loom-js/bench';
import { defineConfig, type PrerenderBundle } from '@loom-js/build';
import type { SerializedStateEnvelope } from '@loom-js/core';

import { brandHead, SITE_DESCRIPTION } from './project/client/brand.mjs';
import { readCoreVersion } from './project/client/core-version.mjs';
import {
    assertLlmsTopics,
    llmsFull,
    llmsIndex
} from './project/client/llms-text.mjs';
import { topicDescription } from './project/client/page-meta.mjs';
import {
    assertSearchIndex,
    type SearchEntry,
    searchIndexJson
} from './project/client/search-index.mjs';
import { sectionTitle, topicPageTitle } from './src/app/page-title';
import type {
    DocsSectionSummary,
    DocsTopicSummary,
    DocsTopicText,
    PrerenderTransportConfig
} from './src/app/prerender.entry';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// What `src/app/prerender.entry.ts` exports, for the hooks below.
interface LoomPrerenderBundle extends PrerenderBundle {
    benchResultsResourceKey: string;
    configurePrerenderTransport: (config: PrerenderTransportConfig) => void;
    docsContentResourceKey: (topicSlug: string) => string;
    docsTopicSearchEntries: (
        topicSlug: string,
        group: string
    ) => Promise<SearchEntry[]>;
    docsTopicText: (
        topicSlug: string,
        origin: string
    ) => Promise<DocsTopicText>;
    listDocsSections: () => Promise<DocsSectionSummary[]>;
    listDocsTopics: () => Promise<DocsTopicSummary[]>;
    seedBenchResults: (results: BenchResults) => void;
}

// The bench workspace's output — a turbo task output `@loom-js/loom#build`
// depends on, so it is fresh or cache-restored before this runs.
const BENCH_RESULTS_PATH = path.resolve(
    import.meta.dirname,
    '../bench/results/latest.json'
);
const BENCH_ROUTE = '/benchmarks';

const readBenchResults = async (): Promise<BenchResults> => {
    let results: Partial<BenchResults>;

    try {
        results = JSON.parse(
            await readFile(BENCH_RESULTS_PATH, 'utf8')
        ) as Partial<BenchResults>;
    } catch (error) {
        throw new Error(
            `[prerender] ${BENCH_RESULTS_PATH} could not be read (${
                error instanceof Error ? error.message : String(error)
            }) — run \`pnpm bench\` or let turbo restore it.`
        );
    }

    if (results.schemaVersion !== 1 || !results.frameworks?.length) {
        throw new Error(
            `[prerender] ${BENCH_RESULTS_PATH} is not a schema-1 results document with frameworks — failing the build.`
        );
    }

    return results as BenchResults;
};

// Where the docs are served. The llms text files are read away from the
// site, so their links carry the full address.
const SITE_ORIGIN =
    process.env.SITE_ORIGIN || 'https://loom-js-docs.vercel.app';

// Utility topics that document nothing about the framework.
const LLMS_EXCLUDED_SLUGS = ['feedback'];
// Where the search palette fetches its index — every listed topic, the
// utility ones included (findability, not API content).
const SEARCH_INDEX_FILE = 'static/search/index.json';

// The core release the header shows; also checked on every prerendered route.
const coreVersion = readCoreVersion(import.meta.dirname);

const apiUrl = process.env.API_URL ?? '';
// Preview is an explicit opt-in (`.env.local` sets it for dev) — production
// must never default onto Contentful's uncached Preview API.
const ctfIsPreview = process.env.CTF_IS_PREVIEW === 'true';

// The topic listing, captured by `routes` for `validate`.
let topicTitles = new Map<string, string>();
// The measured framework names, captured by `setup` for `validate`.
let benchFrameworkNames: string[] = [];

export default defineConfig<LoomPrerenderBundle>({
    copy: [
        { from: '../bench/results/latest.json', to: './static/bench' },
        // Served at the root too, for clients that never read the shell.
        { from: './public/static/favicon/favicon.ico', to: '.' }
    ],
    define: {
        __API_URL__: apiUrl,
        __CORE_VERSION__: coreVersion,
        __CTF_IS_PREVIEW__: ctfIsPreview
    },
    entry: './src/app/bootstrap',
    html: {
        // Shell-owned: prerendered markup needs the theme before the boot runs.
        bodyClass: 'theme-dark',
        head: ({ scope }) =>
            [
                `    <link rel="dns-prefetch" href="${apiUrl}/api/contentful/graphql" />`,
                brandHead({ origin: SITE_ORIGIN, title: sectionTitle(scope) })
            ].join('\n'),
        title: sectionTitle
    },
    prerender: {
        after: async ({ bundle, outDir }) => {
            const listedSections = await bundle.listDocsSections();
            const searchEntries = (
                await Promise.all(
                    listedSections.map(({ title, topics }) =>
                        Promise.all(
                            topics.map(({ slug }) =>
                                bundle.docsTopicSearchEntries(slug, title)
                            )
                        )
                    )
                )
            ).flat(2);

            assertSearchIndex(
                searchEntries,
                listedSections.flatMap(({ topics }) => topics)
            );

            const searchIndexPath = path.join(outDir, SEARCH_INDEX_FILE);
            const searchIndex = searchIndexJson(searchEntries);

            await mkdir(path.dirname(searchIndexPath), { recursive: true });
            await writeFile(searchIndexPath, searchIndex);
            console.info(
                `> wrote ${SEARCH_INDEX_FILE} (${searchEntries.length} entries, ${Buffer.byteLength(searchIndex)} bytes)`
            );

            const sections = await Promise.all(
                listedSections.map(async ({ title, topics: listed }) => ({
                    title,
                    topics: await Promise.all(
                        listed
                            .filter(
                                ({ slug }) =>
                                    !LLMS_EXCLUDED_SLUGS.includes(slug)
                            )
                            .map(async (topic) => ({
                                ...topic,
                                ...(await bundle.docsTopicText(
                                    topic.slug,
                                    SITE_ORIGIN
                                ))
                            }))
                    )
                }))
            );
            const llmsSite = {
                name: 'loom',
                origin: SITE_ORIGIN,
                sections: sections.filter((section) => section.topics.length)
            };

            assertLlmsTopics(llmsSite.sections);

            for (const [fileName, content] of [
                ['llms.txt', llmsIndex(llmsSite)],
                ['llms-full.txt', llmsFull(llmsSite)]
            ] as const) {
                await writeFile(path.join(outDir, fileName), content);
                console.info(
                    `> wrote ${fileName} (${Buffer.byteLength(content)} bytes)`
                );
            }
        },
        entry: './src/app/prerender.entry',
        // Docs topics share the `/docs` shell; each gets its own title and
        // a description cut from its lead.
        meta: async (route, _output, bundle) => {
            if (!route.startsWith('/docs/')) {
                return undefined;
            }

            const slug = route.replace('/docs/', '');
            const { lead } = await bundle.docsTopicText(slug, SITE_ORIGIN);
            const description = topicDescription(lead);

            if (!description) {
                console.info(
                    `> ${route} has no lead paragraph; using the site description.`
                );
            }

            return {
                description: description || SITE_DESCRIPTION,
                title: topicPageTitle(topicTitles.get(slug) ?? '')
            };
        },
        preloadFonts: true,
        routes: async (bundle) => {
            const topics = await bundle.listDocsTopics();

            topicTitles = new Map(
                topics.map(({ slug, title }) => [slug, title])
            );

            return [
                '/',
                BENCH_ROUTE,
                ...topics.map(({ slug }) => `/docs/${slug}`)
            ];
        },
        // The `/api` proxy only exists at runtime: build-time renders call
        // Contentful itself, authorized with the Delivery token.
        setup: async (bundle) => {
            const spaceId = process.env.CTF_SPACE_ID;
            const token = process.env.CTF_TOKEN;

            if (!spaceId || !token) {
                throw new Error(
                    '[prerender] CTF_SPACE_ID and CTF_TOKEN are required for the production prerender phase.'
                );
            }

            bundle.configurePrerenderTransport({ spaceId, token });

            const benchResults = await readBenchResults();

            benchFrameworkNames = benchResults.frameworks.map(
                ({ name }) => name
            );
            bundle.seedBenchResults(benchResults);
        },
        validate: (route, { html, state }, bundle) => {
            // Anchored to the footer — docs code samples quote the notice too.
            const copyright = `© ${new Date().getFullYear()}`;

            if (!html.includes(`${copyright}</footer>`)) {
                throw new Error(
                    `[prerender] ${route} rendered without its "${copyright}" footer — failing the build.`
                );
            }

            // Anchored to the header link, so a quoted version can't pass.
            if (!html.includes(`v${coreVersion}</a>`)) {
                throw new Error(
                    `[prerender] ${route} rendered without the "v${coreVersion}" core version — failing the build.`
                );
            }

            if (route === '/') {
                if (html.length < 1000) {
                    throw new Error(
                        '[prerender] home route rendered suspiciously little markup — failing the build.'
                    );
                }

                return;
            }

            // `serializeState` wraps the resource values in a versioned
            // envelope — the keys live under its `state` field.
            const envelope = JSON.parse(
                state
            ) as Partial<SerializedStateEnvelope>;
            const stateKeys = Object.keys(envelope.state ?? {});

            if (route === BENCH_ROUTE) {
                const missing = benchFrameworkNames.filter(
                    (name) => !html.includes(name)
                );

                if (missing.length) {
                    throw new Error(
                        `[prerender] ${route} rendered without ${missing.join(', ')} — failing the build.`
                    );
                }

                if (!stateKeys.includes(bundle.benchResultsResourceKey)) {
                    throw new Error(
                        `[prerender] ${route} state is missing its results resource — failing the build.`
                    );
                }

                return;
            }

            // Settled content, not skeletons: the topic's own title must
            // have rendered, and its resource entry must ride the state.
            const slug = route.replace('/docs/', '');
            const title = topicTitles.get(slug) ?? '';

            if (!html.includes(title)) {
                throw new Error(
                    `[prerender] ${route} rendered without its topic content ("${title}") — failing the build.`
                );
            }

            if (!stateKeys.includes(bundle.docsContentResourceKey(slug))) {
                throw new Error(
                    `[prerender] ${route} state is missing its page-content resource — failing the build.`
                );
            }
        }
    },
    publicDir: './public/static',
    routes: ['/', BENCH_ROUTE, '/docs'],
    server: { port: 9092 },
    styles: ['./public/styles/base.css']
});
