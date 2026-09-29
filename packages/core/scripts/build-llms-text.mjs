// Writes llms-full.txt: every docs topic in one markdown file, generated
// from the topic sources in the repo so it matches the version being built.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
);
const TOPICS_DIR = path.resolve(packageDir, '../../docs/topics');
const SITE_ORIGIN = 'https://loom-js-docs.vercel.app';
// Utility topics that document nothing about the framework.
const EXCLUDED_SLUGS = ['feedback'];
const frontMatterRe = /^---\nslug: (.+)\ntitle: (.+)\n---\n/;

const readTopic = async (fileName) => {
    const source = await readFile(path.join(TOPICS_DIR, fileName), 'utf8');
    const [frontMatter, slug, title] = source.match(frontMatterRe) ?? [];

    if (!frontMatter || !slug || !title) {
        throw new Error(
            `[llms-text] ${fileName} has no slug and title front matter.`
        );
    }

    const body = source
        .slice(frontMatter.length)
        .trim()
        // The file is read away from the site, so links carry its address.
        .replace(/\]\(\/docs\//g, `](${SITE_ORIGIN}/docs/`);

    if (!body) {
        throw new Error(`[llms-text] ${fileName} has no body.`);
    }

    return { body, slug, title };
};

// File names carry the learning-path order (01-, 02-, … 05a-).
const fileNames = (await readdir(TOPICS_DIR))
    .filter((fileName) => fileName.endsWith('.md'))
    .sort();
const topics = (await Promise.all(fileNames.map(readTopic))).filter(
    ({ slug }) => !EXCLUDED_SLUGS.includes(slug)
);

if (!topics.length) {
    throw new Error(`[llms-text] no topics found in ${TOPICS_DIR}.`);
}

const content = [
    '# loom',
    ...topics.map(({ body, slug, title }) =>
        [`# ${title}`, `Source: ${SITE_ORIGIN}/docs/${slug}`, body].join('\n\n')
    )
]
    .join('\n\n')
    .concat('\n');
const outPath = path.join(packageDir, 'llms-full.txt');

await writeFile(outPath, content);
console.info(
    `> wrote ${outPath} (${topics.length} topics, ${Buffer.byteLength(content)} bytes)`
);
