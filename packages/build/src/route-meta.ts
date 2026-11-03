// Per-route head metadata: rewrites a shell's title and description tags
// for one prerendered route, leaving every other tag and its order alone.
import type { RouteMeta } from './config';

const escapeHtml = (value: string) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');

const META_TAG = /<meta\b[^>]*>/gi;

const hasAttribute = (tag: string, name: string, value: string) =>
    new RegExp(`\\s${name}=["']${value}["']`, 'i').test(tag);

// Sets `content` on every `<meta>` matching the predicate; reports whether
// any matched.
const setMetaContent = (
    html: string,
    matches: (tag: string) => boolean,
    content: string
) => {
    let found = false;
    const rewritten = html.replace(META_TAG, (tag) => {
        if (!matches(tag)) {
            return tag;
        }

        found = true;

        return /\scontent=/i.test(tag)
            ? tag.replace(
                  /(\scontent=)(?:"[^"]*"|'[^']*')/i,
                  (_match, attribute: string) => `${attribute}"${content}"`
              )
            : tag.replace(/<meta\b/i, () => `<meta content="${content}"`);
    });

    return { found, html: rewritten };
};

/**
 * Applies a route's `title` and `description` to its shell: `<title>` and
 * `og:title`, `<meta name="description">` and `og:description`. A shell
 * without a description tag gets one after `<title>`; Open Graph tags are
 * only rewritten where the shell already has them.
 */
export const applyRouteMeta = (
    html: string,
    { description, title }: RouteMeta
) => {
    let result = html;

    if (title !== undefined) {
        const escapedTitle = escapeHtml(title);

        result = result.replace(
            /<title>[\s\S]*?<\/title>/i,
            () => `<title>${escapedTitle}</title>`
        );
        result = setMetaContent(
            result,
            (tag) => hasAttribute(tag, 'property', 'og:title'),
            escapedTitle
        ).html;
    }

    if (description !== undefined) {
        const escapedDescription = escapeHtml(description);
        const named = setMetaContent(
            result,
            (tag) => hasAttribute(tag, 'name', 'description'),
            escapedDescription
        );

        result = named.found
            ? named.html
            : named.html.replace(
                  /(<\/title>)/i,
                  () =>
                      `</title>\n    <meta content="${escapedDescription}" name="description" />`
              );
        result = setMetaContent(
            result,
            (tag) => hasAttribute(tag, 'property', 'og:description'),
            escapedDescription
        ).html;
    }

    return result;
};
