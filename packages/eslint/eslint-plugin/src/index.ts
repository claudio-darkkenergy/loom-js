import type { ESLint, Linter, Rule } from 'eslint';

import { noDollarPropsOnComponentTags } from './rules/no-dollar-props-on-component-tags.js';
import { preferElementSyntax } from './rules/prefer-element-syntax.js';

const rules: Record<string, Rule.RuleModule> = {
    'no-dollar-props-on-component-tags': noDollarPropsOnComponentTags,
    'prefer-element-syntax': preferElementSyntax
};

const plugin = {
    meta: {
        name: '@loom-js/eslint-plugin'
    },
    rules,
    configs: {} as { recommended: Linter.Config }
} satisfies ESLint.Plugin;

plugin.configs.recommended = {
    name: 'loom/recommended',
    plugins: {
        loom: plugin
    },
    rules: Object.fromEntries(
        Object.keys(rules).map((ruleName) => [`loom/${ruleName}`, 'error'])
    )
};

export default plugin;
