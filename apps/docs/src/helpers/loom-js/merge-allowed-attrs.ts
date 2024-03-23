import { AttrsTemplateTagValue } from '@loom-js/core';

/**
 * A utility which merges allowed attributes into an `attrs` attribute collection.
 * @param attrs The attribute collection.
 * @param { className, id, style } The attribute overrides
 * @returns A shallow copy of the original attribute collection overlapped w/ all valid attribute
 *      overrides.
 */
export const mergeAllowedAttrs = (
    attrs: AttrsTemplateTagValue = {},
    { className, id, style }: AttrsTemplateTagValue
) => {
    const attrsOverrides = { ...attrs };

    switch (true) {
        case className !== undefined:
            attrsOverrides.className = className;
        case id !== undefined:
            attrsOverrides.id = id;
        case style !== undefined:
            attrsOverrides.style = style;
    }

    return attrsOverrides;
};
