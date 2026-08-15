import type {
    ComponentContextPartial,
    ContextFunction,
    TemplateTagValue,
    TemplateTagValueFunction
} from '../../types';
import { getWindow } from '../dom';

export const resolveValue = (
    value: TemplateTagValue,
    ctx: ComponentContextPartial = {}
) => {
    if (typeof value === 'function') {
        let templateTagValue: TemplateTagValue;

        // Using syntax `function contextFunction() {}` w/ this name, exactly.
        if (value.name.toLowerCase().endsWith('contextfunction')) {
            // Passing down a `ComponentContext` in the case the function value is a `ContextFunction`
            // which supports maintaining the component context so we don't unnecessarily create & replace w/ new nodes.
            const resultCtx = (value as ContextFunction)(ctx);
            templateTagValue = resultCtx.root;
        } else {
            templateTagValue = (value as TemplateTagValueFunction)();
        }

        if (templateTagValue instanceof getWindow().NodeList) {
            return Array.from(templateTagValue as NodeList);
        } else {
            // Make sure the function returned a valid value, not another function.
            return sanitizeFnValue(templateTagValue);
        }
    } else if (value instanceof getWindow().NodeList) {
        return Array.from(value as NodeList);
    } else {
        return value || value === 0 ? value : '';
    }
};

function sanitizeFnValue(value: TemplateTagValue) {
    // Make sure the function returns a valid value, not another function.
    return value && typeof value !== 'function' ? value : '';
}
