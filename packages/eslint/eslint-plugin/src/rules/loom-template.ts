import type { Expression, Super } from 'estree';

// The renderer param is named `html` by strong convention (design D3); a
// renamed tag is a documented false negative unless widened via `tagNames`.
export const DEFAULT_TAG_NAMES = ['html'];

export const tagNamesSchema = {
    type: 'array',
    items: { type: 'string' }
} as const;

export const isLoomTemplateTag = (tag: Expression, tagNames: string[]) =>
    tag.type === 'Identifier' && tagNames.includes(tag.name);

// A "component-shaped" reference: a capitalized identifier, or a member
// expression whose final property is capitalized (design D4-c).
export const componentReferenceName = (node: Expression | Super) => {
    if (node.type === 'Identifier' && /^[A-Z]/.test(node.name)) {
        return node.name;
    }

    if (
        node.type === 'MemberExpression' &&
        !node.computed &&
        node.property.type === 'Identifier' &&
        /^[A-Z]/.test(node.property.name)
    ) {
        return node.property.name;
    }

    return null;
};
