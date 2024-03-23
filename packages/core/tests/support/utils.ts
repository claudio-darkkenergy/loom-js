import type {
    AttrsTemplateTagValue,
    OnTemplateTagValue
} from '../../src/types';

export const argException = (value: string | number, position: number) =>
    `at arg ${position}, actually called w/ ${value}`;
export const callCountException = (count: number) =>
    `actually called ${count} ${count === 1 ? 'time' : 'times'}`;
export const randomNumber = (size = 1000) => Math.round(Math.random() * size);

export const injectArgsToEventHandler = (
    on: OnTemplateTagValue = {},
    eventName: string,
    ...args: any[]
) => {
    if (on[eventName]) {
        on[eventName] = (on[eventName] as Function).bind(null, ...args);
    }
};

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
