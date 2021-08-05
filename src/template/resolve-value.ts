import { TemplateTagValue } from '../types';

export const resolveValue = (value: TemplateTagValue) => {
    if (typeof value === 'function') {
        const templateTagValue = value();

        // Make sure the function returns a valid value, not another function.
        return templateTagValue && typeof templateTagValue !== 'function'
            ? templateTagValue
            : '';
    } else {
        return value || '';
    }
};
