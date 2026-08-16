import type { Rule } from 'eslint';

import {
    componentReferenceName,
    DEFAULT_TAG_NAMES,
    isLoomTemplateTag,
    tagNamesSchema
} from './loom-template.js';

const ATTRIBUTE_NAME_AT = /^\$[\w-]+/;

export const noDollarPropsOnComponentTags: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow `$`-prefixed props on component tags — `$` has element-only meaning and throws at first render.'
        },
        messages: {
            noDollarProps:
                '{{name}} on a component tag throws at first render — `$` props are element-only. Pass it through the component’s props instead (e.g. an `onClick`-style prop).'
        },
        schema: [
            {
                type: 'object',
                properties: {
                    tagNames: tagNamesSchema
                },
                additionalProperties: false
            }
        ]
    },
    create(context) {
        const options = (context.options[0] ?? {}) as { tagNames?: string[] };
        const tagNames = options.tagNames ?? DEFAULT_TAG_NAMES;

        return {
            TaggedTemplateExpression(node) {
                if (!isLoomTemplateTag(node.tag, tagNames)) {
                    return;
                }

                const { expressions, quasis } = node.quasi;
                let inComponentTag = false;
                let quote: '"' | "'" | null = null;

                quasis.forEach((quasi, index) => {
                    const text = quasi.value.raw;
                    let position = 0;

                    while (inComponentTag && position < text.length) {
                        const char = text[position];

                        if (quote) {
                            if (char === quote) {
                                quote = null;
                            }

                            position += 1;
                            continue;
                        }

                        if (char === '"' || char === "'") {
                            quote = char;
                            position += 1;
                            continue;
                        }

                        if (char === '>') {
                            inComponentTag = false;
                            break;
                        }

                        const attributeName =
                            char === '$' && /\s/.test(text[position - 1] ?? ' ')
                                ? ATTRIBUTE_NAME_AT.exec(
                                      text.slice(position)
                                  )?.[0]
                                : undefined;

                        if (attributeName) {
                            context.report({
                                node: quasi,
                                messageId: 'noDollarProps',
                                data: { name: attributeName }
                            });
                            position += attributeName.length;
                            continue;
                        }

                        position += 1;
                    }

                    const tagExpression = expressions[index];

                    if (
                        !inComponentTag &&
                        text.endsWith('<') &&
                        tagExpression &&
                        componentReferenceName(tagExpression)
                    ) {
                        inComponentTag = true;
                        quote = null;
                    }
                });
            }
        };
    }
};
