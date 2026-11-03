// Per-route head metadata for the prerender pass: a docs topic's title and
// a search-snippet description cut from its lead paragraph.

/** How long a search snippet runs before it is cut, in characters. */
export const DESCRIPTION_MAX_LENGTH = 160;

/** Markdown inline syntax reduced to the text a reader sees. */
export const markdownToPlainText = (markdown: string) =>
    markdown
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/`([^`]*)`/g, '$1')
        // Emphasis only at word edges, so snake_case survives.
        .replace(/(^|\W)(\*\*|__|\*|_|~~)(\S(?:.*?\S)?)\2(?=\W|$)/g, '$1$3')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * A topic's description: its lead as plain text, cut at a word boundary to
 * fit a search snippet. Empty when the topic has no lead.
 */
export const topicDescription = (lead: string) => {
    const text = markdownToPlainText(lead);

    if (text.length <= DESCRIPTION_MAX_LENGTH) {
        return text;
    }

    const cut = text.slice(0, DESCRIPTION_MAX_LENGTH - 1);
    const lastSpace = cut.lastIndexOf(' ');

    return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, '')}…`;
};
