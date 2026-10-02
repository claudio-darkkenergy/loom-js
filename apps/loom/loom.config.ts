import { defineConfig, type PrerenderBundle } from '@loom-js/build';
import type { SerializedStateEnvelope } from '@loom-js/core';

import {
    assertLlmsTopics,
    llmsFull,
    llmsIndex
} from './project/client/llms-text.mjs';
import type {
    DocsSectionSummary,
    DocsTopicSummary,
    DocsTopicText,
    PrerenderTransportConfig
} from './src/app/prerender.entry';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

// What `src/app/prerender.entry.ts` exports, for the hooks below.
interface LoomPrerenderBundle extends PrerenderBundle {
    configurePrerenderTransport: (config: PrerenderTransportConfig) => void;
    docsContentResourceKey: (topicSlug: string) => string;
    docsTopicText: (
        topicSlug: string,
        origin: string
    ) => Promise<DocsTopicText>;
    listDocsSections: () => Promise<DocsSectionSummary[]>;
    listDocsTopics: () => Promise<DocsTopicSummary[]>;
}

// Where the docs are served. The llms text files are read away from the
// site, so their links carry the full address.
const SITE_ORIGIN =
    process.env.SITE_ORIGIN || 'https://loom-js-docs.vercel.app';

// Utility topics that document nothing about the framework.
const LLMS_EXCLUDED_SLUGS = ['feedback'];

const apiUrl = process.env.API_URL ?? '';
// Preview is an explicit opt-in (`.env.local` sets it for dev) — production
// must never default onto Contentful's uncached Preview API.
const ctfIsPreview = process.env.CTF_IS_PREVIEW === 'true';

// The topic listing, captured by `routes` for `validate`.
let topicTitles = new Map<string, string>();

export default defineConfig<LoomPrerenderBundle>({
    copy: [{ from: './mocks/**/*', to: './mocks' }],
    define: {
        __API_URL__: apiUrl,
        __CTF_IS_PREVIEW__: ctfIsPreview
    },
    entry: './src/app/bootstrap',
    html: {
        // Shell-owned: prerendered markup needs the theme before the boot runs.
        bodyClass: 'theme-dark',
        head: () =>
            `    <link rel="dns-prefetch" href="${apiUrl}/api/contentful/graphql" />`,
        title: (scope) =>
            scope === '/docs' ? 'Docs | Loomjs' : 'Home | Loomjs'
    },
    prerender: {
        after: async ({ bundle, outDir }) => {
            const sections = await Promise.all(
                (await bundle.listDocsSections()).map(
                    async ({ title, topics: listed }) => ({
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
                    })
                )
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
        preloadFonts: true,
        routes: async (bundle) => {
            const topics = await bundle.listDocsTopics();

            topicTitles = new Map(
                topics.map(({ slug, title }) => [slug, title])
            );

            return ['/', ...topics.map(({ slug }) => `/docs/${slug}`)];
        },
        // The `/api` proxy only exists at runtime: build-time renders call
        // Contentful itself, authorized with the Delivery token.
        setup: (bundle) => {
            const spaceId = process.env.CTF_SPACE_ID;
            const token = process.env.CTF_TOKEN;

            if (!spaceId || !token) {
                throw new Error(
                    '[prerender] CTF_SPACE_ID and CTF_TOKEN are required for the production prerender phase.'
                );
            }

            bundle.configurePrerenderTransport({ spaceId, token });
        },
        validate: (route, { html, state }, bundle) => {
            if (route === '/') {
                if (html.length < 1000) {
                    throw new Error(
                        '[prerender] home route rendered suspiciously little markup — failing the build.'
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

            // `serializeState` wraps the resource values in a versioned
            // envelope — the keys live under its `state` field.
            const envelope = JSON.parse(
                state
            ) as Partial<SerializedStateEnvelope>;
            const stateKeys = Object.keys(envelope.state ?? {});

            if (!stateKeys.includes(bundle.docsContentResourceKey(slug))) {
                throw new Error(
                    `[prerender] ${route} state is missing its page-content resource — failing the build.`
                );
            }
        }
    },
    publicDir: './public/static',
    routes: ['/', '/docs'],
    server: { port: 9092 },
    styles: ['./public/styles/base.css']
});
