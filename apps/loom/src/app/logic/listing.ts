/**
 * Shape helpers for the docs page listing. A listed entry with linked
 * children (a non-empty `contentCollection`) is a nav group; one without is
 * a topic. Groups partition the flat learning-path order contiguously, so
 * flattening a grouped listing reproduces that exact order — the order
 * pagination and prerender enumeration read.
 */

/** The structural slice of a listing entry the nav logic reads. */
export interface ListingEntry {
    contentCollection?: { items: ListingEntry[] };
    slug?: string;
    title?: Node;
}

export interface ListingSection {
    items: ListingEntry[];
    title?: Node;
}

const groupTopics = (entry: ListingEntry) =>
    entry.contentCollection?.items.length
        ? entry.contentCollection.items
        : undefined;

/**
 * Restores the flat topic order from a possibly grouped listing. A flat
 * listing passes through unchanged.
 */
export const flattenListing = (entries: ListingEntry[] = []) =>
    entries.flatMap((entry) => groupTopics(entry) ?? [entry]);

/**
 * Normalizes a listing into nav sections: a group becomes a titled section;
 * consecutive ungrouped entries pool into an untitled one. A flat listing
 * yields a single untitled section.
 */
export const listingSections = (entries: ListingEntry[] = []) => {
    const sections: ListingSection[] = [];

    entries.forEach((entry) => {
        const topics = groupTopics(entry);
        const openSection = sections.at(-1);

        if (topics) {
            sections.push({ items: topics, title: entry.title });
        } else if (openSection && !openSection.title) {
            openSection.items.push(entry);
        } else {
            sections.push({ items: [entry] });
        }
    });

    return sections;
};
