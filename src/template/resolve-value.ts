import { ContextFunction, TemplateContext, TemplateTagValue } from '../types';

export const resolveValue = (
    value: TemplateTagValue,
    ctx?: TemplateContext
) => {
    if (typeof value === 'function') {
        // Passing down a `TemplateContext` in the case the function value is a `ContextFunction`
        // which supports maintaining the component context so we don't unnecessarily create & replace w/ new nodes.
        const templateTagValue = (value as ContextFunction)(
            ctx
        ) as TemplateTagValue;

        // Make sure the function returns a valid value, not another function.
        return templateTagValue && typeof templateTagValue !== 'function'
            ? templateTagValue
            : '';
    } else {
        return value || '';
    }
};
