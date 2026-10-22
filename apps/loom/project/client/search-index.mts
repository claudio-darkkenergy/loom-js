// Assembles the docs search index the site serves at
// `/static/search/index.json`: one entry per topic lead and per h2/h3
// section, built from the same Contentful data the pages render.

export interface SearchEntry {
    /** The rendered heading's id; `''` for the topic's lead entry. */
    anchor: string;
    /** The side-nav group the topic sits in. */
    group: string;
    /** The section heading; `''` for the lead entry. */
    heading: string;
    /** 0 for the lead, else the heading level. */
    level: 0 | 2 | 3;
    slug: string;
    /** The section's prose, without code blocks. */
    text: string;
    /** The topic title. */
    title: string;
}

export interface SearchTopic {
    slug: string;
    title: string;
}

const entryKey = ({ anchor, slug }: SearchEntry) =>
    anchor ? `${slug}#${anchor}` : slug;

/**
 * Fails the build on an index that would mislead the palette: a listed
 * topic with no lead entry, a section with no heading, or two entries
 * landing on the same target.
 */
export const assertSearchIndex = (
    entries: SearchEntry[],
    topics: SearchTopic[]
) => {
    const leads = new Set(
        entries.filter(({ level }) => level === 0).map(({ slug }) => slug)
    );
    const seen = new Set<string>();

    topics.forEach(({ slug }) => {
        if (!leads.has(slug)) {
            throw new Error(`[search-index] topic "${slug}" has no lead entry`);
        }
    });

    entries.forEach((entry) => {
        const key = entryKey(entry);

        if (entry.level !== 0 && !entry.heading) {
            throw new Error(
                `[search-index] topic "${entry.slug}" has a section with no heading`
            );
        }

        if (seen.has(key)) {
            throw new Error(`[search-index] "${key}" appears twice`);
        }

        seen.add(key);
    });
};

/** The file body — compact, since the palette fetches it on open. */
export const searchIndexJson = (entries: SearchEntry[]) =>
    JSON.stringify(entries);
