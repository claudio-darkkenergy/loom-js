import type { Rule } from 'eslint';

import {
    componentReferenceName,
    DEFAULT_TAG_NAMES,
    isLoomTemplateTag,
    tagNamesSchema
} from './loom-template.js';

const GLOBAL_CONSTRUCTOR_LIKES = new Set([
    'Array',
    'BigInt',
    'Boolean',
    'Date',
    'Number',
    'Object',
    'String',
    'Symbol'
]);

// An interpolation preceded by `=`, `="`, or `='` is an attribute value, not a child.
const ATTRIBUTE_VALUE_CONTEXT = /=["']?$/;

export const preferElementSyntax: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Prefer a component tag over a direct component-call interpolation in child position.'
        },
        messages: {
            preferElementSyntax:
                'Direct call of {{name}} in child position — use element syntax instead: `<${{{name}}} …></${{{name}}}>`. (If {{name}} is not a component, it violates the capitalized-components naming convention this rule assumes; use the ignoreNames option.)'
        },
        schema: [
            {
                type: 'object',
                properties: {
                    tagNames: tagNamesSchema,
                    ignoreNames: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                },
                additionalProperties: false
            }
        ]
    },
    create(context) {
        const options = (context.options[0] ?? {}) as {
            tagNames?: string[];
            ignoreNames?: string[];
        };
        const tagNames = options.tagNames ?? DEFAULT_TAG_NAMES;
        const ignoreNames = new Set([
            ...GLOBAL_CONSTRUCTOR_LIKES,
            ...(options.ignoreNames ?? [])
        ]);

        return {
            TaggedTemplateExpression(node) {
                if (!isLoomTemplateTag(node.tag, tagNames)) {
                    return;
                }

                node.quasi.expressions.forEach((expression, index) => {
                    const precedingText =
                        node.quasi.quasis[index]?.value.raw ?? '';

                    if (ATTRIBUTE_VALUE_CONTEXT.test(precedingText)) {
                        return;
                    }

                    if (expression.type !== 'CallExpression') {
                        return;
                    }

                    const name = componentReferenceName(expression.callee);

                    if (!name || ignoreNames.has(name)) {
                        return;
                    }

                    context.report({
                        node: expression,
                        messageId: 'preferElementSyntax',
                        data: { name }
                    });
                });
            }
        };
    }
};
