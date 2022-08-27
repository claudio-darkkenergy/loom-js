import {
    ComponentContextPartial,
    ContextFunction,
    TemplateTagValue
} from '../types';

export const resolveValue = (
    value: TemplateTagValue,
    ctx?: ComponentContextPartial
) => {
    if (typeof value === 'function') {
        // Passing down a `ComponentContext` in the case the function value is a `ContextFunction`
        // which supports maintaining the component context so we don't unnecessarily create & replace w/ new nodes.
        const templateTagValue = (value as ContextFunction)(
            ctx
        ) as TemplateTagValue;

        if (templateTagValue instanceof NodeList) {
            return Array.from(templateTagValue);
        } else {
            // Make sure the function returns a valid value, not another function.
            return templateTagValue && typeof templateTagValue !== 'function'
                ? templateTagValue
                : '';
        }
    } else if (value instanceof NodeList) {
        return Array.from(value);
    } else {
        return value || '';
    }
};
