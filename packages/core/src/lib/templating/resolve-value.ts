import type {
    ComponentContextPartial,
    ContextFunction,
    TemplateTagValue,
    TemplateTagValueFunction
} from '../../types';

export const resolveValue = (
    value: TemplateTagValue,
    ctx: ComponentContextPartial = {}
) => {
    if (typeof value === 'function') {
        let templateTagValue: TemplateTagValue;

        // Using syntax `function contextFunction() {}` w/ this name, exactly.
        if (
            ['contextFunction', 'activityContextFunction'].includes(value.name)
        ) {
            // Passing down a `ComponentContext` in the case the function value is a `ContextFunction`
            // which supports maintaining the component context so we don't unnecessarily create & replace w/ new nodes.
            const resultCtx = (value as ContextFunction)(ctx);
            templateTagValue = resultCtx.root;
        } else {
            templateTagValue = (value as TemplateTagValueFunction)();
        }

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
